import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  addDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  onSnapshot
} from 'firebase/firestore';
import { db, auth, signOutUser } from './firebaseClient';

const getCollectionName = (entityName) => {
  if (entityName === 'User') return 'users';
  
  // Standard conversion to snake_case and pluralize
  let snake = entityName.replace(/([A-Z])/g, "_$1").toLowerCase();
  if (snake.startsWith('_')) {
    snake = snake.slice(1);
  }
  
  // Pluralize basic cases
  if (snake.endsWith('s')) {
    return snake;
  } else if (snake.endsWith('y')) {
    return snake.slice(0, -1) + 'ies';
  } else {
    return snake + 's';
  }
};

const buildQuery = (collectionRef, filterObj, orderByStr, limitNum) => {
  let q = collectionRef;
  const constraints = [];
  
  if (filterObj && typeof filterObj === 'object') {
    Object.entries(filterObj).forEach(([field, val]) => {
      constraints.push(where(field, '==', val));
    });
  }
  
  if (orderByStr && typeof orderByStr === 'string') {
    let field = orderByStr;
    let dir = 'asc';
    if (field.startsWith('-')) {
      dir = 'desc';
      field = field.substring(1);
    }
    constraints.push(orderBy(field, dir));
  }
  
  if (limitNum) {
    constraints.push(limit(limitNum));
  }
  
  if (constraints.length > 0) {
    q = query(collectionRef, ...constraints);
  }
  return q;
};

const runQuerySafely = async (collectionName, collectionRef, filterObj, orderByStr, limitNum) => {
  try {
    const q = buildQuery(collectionRef, filterObj, orderByStr, limitNum);
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.warn(`Firestore query failed for ${collectionName}, falling back to client-side filtering:`, error);
    
    // Fallback: Fetch everything and filter/sort/limit client-side
    const snapshot = await getDocs(collectionRef);
    let results = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    
    // Client-side filtering
    if (filterObj && typeof filterObj === 'object') {
      results = results.filter(item => {
        return Object.entries(filterObj).every(([key, val]) => item[key] === val);
      });
    }
    
    // Client-side sorting
    if (orderByStr && typeof orderByStr === 'string') {
      let field = orderByStr;
      let isDesc = false;
      if (field.startsWith('-')) {
        isDesc = true;
        field = field.substring(1);
      }
      results.sort((a, b) => {
        const valA = a[field];
        const valB = b[field];
        if (valA === undefined) return 1;
        if (valB === undefined) return -1;
        if (valA < valB) return isDesc ? 1 : -1;
        if (valA > valB) return isDesc ? -1 : 1;
        return 0;
      });
    }
    
    // Client-side limit
    if (limitNum) {
      results = results.slice(0, limitNum);
    }
    
    return results;
  }
};

const createDoc = async (collectionRef, data) => {
  const payload = {
    created_at: new Date().toISOString(),
    created_date: new Date().toISOString(),
    ...data
  };
  const id = payload.id || payload.uid;
  if (id) {
    const dataToSet = { ...payload };
    delete dataToSet.id;
    await setDoc(doc(collectionRef, id), dataToSet, { merge: true });
    return { id, ...payload };
  } else {
    const docRef = await addDoc(collectionRef, payload);
    return { id: docRef.id, ...payload };
  }
};

const updateDocHelper = async (collectionRef, id, data) => {
  if (!id) throw new Error('Document ID is required for update');
  const docRef = doc(collectionRef, id);
  const payload = {
    updated_at: new Date().toISOString(),
    ...data
  };
  await updateDoc(docRef, payload);
  return { id, ...payload };
};

const deleteDocHelper = async (collectionRef, id) => {
  if (!id) throw new Error('Document ID is required for delete');
  const docRef = doc(collectionRef, id);
  await deleteDoc(docRef);
  return { id };
};

const subscribeHelper = (collectionRef, callback) => {
  let isFirst = true;
  return onSnapshot(collectionRef, (snapshot) => {
    if (isFirst) {
      isFirst = false;
      return;
    }
    snapshot.docChanges().forEach((change) => {
      const docData = { id: change.doc.id, ...change.doc.data() };
      if (change.type === 'added') {
        callback({ type: 'create', id: change.doc.id, data: docData });
      } else if (change.type === 'modified') {
        callback({ type: 'update', id: change.doc.id, data: docData });
      } else if (change.type === 'removed') {
        callback({ type: 'delete', id: change.doc.id });
      }
    });
  });
};

const executeFunction = async (functionName, payload) => {
  console.log(`Executing function ${functionName} with payload:`, payload);
  
  if (functionName === 'verifyPin') {
    const currentUser = auth.currentUser;
    if (!currentUser) return { data: { success: false, error: 'Not authenticated' } };
    const userSnap = await getDoc(doc(db, 'users', currentUser.uid));
    if (!userSnap.exists()) return { data: { success: false, error: 'User doc not found' } };
    const userData = userSnap.data();
    if (!userData.pin) {
      return { data: { success: false, no_pin: true, error: 'PIN not set' } };
    }
    const success = String(userData.pin) === String(payload.pin);
    return { data: { success, error: success ? null : 'Wrong PIN' } };
  }
  
  if (functionName === 'geoCheck') {
    return { data: { allowed: true } };
  }
  
  if (functionName === 'adminAuthVerify') {
    const { step, email, pin, otp } = payload;
    const userQuery = query(collection(db, 'users'), where('email', '==', email));
    const userSnap = await getDocs(userQuery);
    if (userSnap.empty) {
      return { data: { success: false, error: 'Unauthorized email address.' } };
    }
    const userDoc = userSnap.docs[0];
    const userData = userDoc.data();
    if (userData.role !== 'admin') {
      return { data: { success: false, error: 'Not an admin user.' } };
    }
    
    if (step === 'email') {
      return { data: { success: true } };
    }
    if (step === 'pin') {
      const success = userData.pin && String(userData.pin) === String(pin);
      return { data: { success, error: success ? null : 'Incorrect PIN.' } };
    }
    if (step === 'otp') {
      if (otp && otp.length === 6) {
        return { data: { success: true } };
      }
      return { data: { success: false, error: 'Incorrect OTP.' } };
    }
  }
  
  if (functionName === 'adminUpdateUser') {
    const { target_user_id, data: updates } = payload;
    if (!target_user_id) return { data: { success: false, error: 'target_user_id is required' } };
    await updateDoc(doc(db, 'users', target_user_id), updates);
    return { data: { success: true } };
  }
  
  if (functionName === 'approveDeposit') {
    const id = payload.requestId || payload.depositId;
    const status = payload.status || 'approved';
    const adminNote = payload.admin_note || '';
    const repeatCount = payload.repeat_count || 1;
    
    if (!id) return { data: { success: false, error: 'Request ID is required' } };
    
    const reqRef = doc(db, 'manual_deposit_requests', id);
    const reqSnap = await getDoc(reqRef);
    if (!reqSnap.exists()) return { data: { success: false, error: 'Deposit request not found' } };
    const reqData = reqSnap.data();
    
    await updateDoc(reqRef, {
      status,
      admin_note: adminNote,
      updated_at: new Date().toISOString()
    });
    
    if (status === 'approved') {
      const userEmail = reqData.user_email;
      if (userEmail) {
        const userQuery = query(collection(db, 'users'), where('email', '==', userEmail));
        const userSnap = await getDocs(userQuery);
        if (!userSnap.empty) {
          const userDoc = userSnap.docs[0];
          const userData = userDoc.data();
          const bdtAmount = Number(reqData.bdt_amount || reqData.amount_sent || 0) * repeatCount;
          const currentBalance = Number(userData.balance || 0);
          await updateDoc(userDoc.ref, {
            balance: currentBalance + bdtAmount,
            updated_at: new Date().toISOString()
          });
        }
      }
    }
    return { data: { success: true } };
  }
  
  if (functionName === 'approveTransaction') {
    const { txId, action, last4Digit } = payload;
    if (!txId) return { data: { success: false, error: 'txId is required' } };
    
    const txRef = doc(db, 'transactions', txId);
    const txSnap = await getDoc(txRef);
    if (!txSnap.exists()) return { data: { success: false, error: 'Transaction not found' } };
    
    const status = action === 'approve' ? 'approved' : 'rejected';
    const updates = {
      status,
      updated_at: new Date().toISOString()
    };
    if (action === 'approve' && last4Digit !== undefined) {
      updates.last_digits = last4Digit;
    }
    await updateDoc(txRef, updates);
    return { data: { success: true } };
  }
  
  if (functionName === 'approveWalletRequest') {
    const { requestId, status } = payload;
    if (!requestId) return { data: { success: false, error: 'requestId is required' } };
    await updateDoc(doc(db, 'wallet_requests', requestId), {
      status,
      updated_at: new Date().toISOString()
    });
    return { data: { success: true } };
  }
  
  if (functionName === 'adminUserOps') {
    const { action, target_user_id, data: opData } = payload;
    if (!target_user_id) return { data: { success: false, error: 'target_user_id is required' } };
    
    const userRef = doc(db, 'users', target_user_id);
    const userSnap = await getDoc(userRef);
    if (!userSnap.exists()) return { data: { success: false, error: 'User not found' } };
    const userData = userSnap.data();
    
    if (action === 'add_balance') {
      const amount = Number(opData.amount || 0);
      const balance_after = Number(userData.balance || 0) + amount;
      await updateDoc(userRef, { balance: balance_after, updated_at: new Date().toISOString() });
      return { data: { success: true, balance_after } };
    }
    
    if (action === 'deduct_balance') {
      const amount = Number(opData.amount || 0);
      const balance_after = Number(userData.balance || 0) - amount;
      await updateDoc(userRef, { balance: balance_after, updated_at: new Date().toISOString() });
      return { data: { success: true, balance_after } };
    }
    
    if (action === 'reset_pin') {
      await updateDoc(userRef, { pin: null, updated_at: new Date().toISOString() });
      return { data: { success: true } };
    }
  }
  
  if (functionName === 'notifyAdminNewTransaction') {
    await addDoc(collection(db, 'app_notifications'), {
      title: 'New Transaction Request',
      message: `${payload.userName || 'A user'} has submitted a new ${payload.type || 'transaction'} transfer request of ${payload.amount || ''}.`,
      is_read_by: [],
      created_at: new Date().toISOString(),
      created_date: new Date().toISOString()
    });
    return { data: { success: true } };
  }
  
  if (functionName === 'verifyAgentCode') {
    const agentQuery = query(collection(db, 'agents'), where('agent_code', '==', payload.agent_code));
    const agentSnap = await getDocs(agentQuery);
    return { data: { success: !agentSnap.empty } };
  }
  
  if (functionName === 'seniorAgentRequest') {
    return { data: { success: true } };
  }
  
  // Default fallback
  return { data: { success: true } };
};

const entityProxy = new Proxy({}, {
  get: (target, entityName) => {
    const collectionName = getCollectionName(entityName);
    const collectionRef = collection(db, collectionName);
    
    return {
      list: async (orderByStr, limitNum) => {
        return runQuerySafely(collectionName, collectionRef, null, orderByStr, limitNum);
      },
      filter: async (filterObj, orderByStr, limitNum) => {
        return runQuerySafely(collectionName, collectionRef, filterObj, orderByStr, limitNum);
      },
      create: async (data) => {
        return createDoc(collectionRef, data);
      },
      update: async (id, data) => {
        return updateDocHelper(collectionRef, id, data);
      },
      delete: async (id) => {
        return deleteDocHelper(collectionRef, id);
      },
      subscribe: (callback) => {
        return subscribeHelper(collectionRef, callback);
      }
    };
  }
});

export const base44 = {
  auth: {
    isAuthenticated: async () => {
      return !!auth.currentUser;
    },
    me: async () => {
      if (!auth.currentUser) return null;
      const snap = await getDoc(doc(db, 'users', auth.currentUser.uid));
      return snap.exists() ? { id: auth.currentUser.uid, ...snap.data() } : null;
    },
    logout: async () => {
      await signOutUser();
    },
    redirectToLogin: () => {
      window.location.href = '/welcome';
    }
  },
  functions: {
    invoke: async (functionName, payload) => {
      return executeFunction(functionName, payload);
    }
  },
  entities: entityProxy,
  integrations: {
    Core: {
      UploadFile: async ({ file }) => {
        try {
          const { getStorage, ref, uploadBytes, getDownloadURL } = await import('firebase/storage');
          const storage = getStorage();
          const fileRef = ref(storage, `uploads/${Date.now()}_${file.name}`);
          await uploadBytes(fileRef, file);
          const url = await getDownloadURL(fileRef);
          return { file_url: url };
        } catch (err) {
          console.warn('Firebase Storage upload failed or not configured, using base64 fallback:', err);
          return new Promise((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve({ file_url: reader.result });
            reader.readAsDataURL(file);
          });
        }
      }
    }
  },
  asServiceRole: {
    entities: entityProxy
  }
};

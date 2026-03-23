/**
 * DATA LAYER — Campus Waste Management System
 * All state lives in localStorage. sessionStorage holds current user.
 */
const WMS = (() => {
  const STORE = 'wms_data';
  const SESSION = 'wms_session';

  // ── Seed Data ─────────────────────────────────────────────────────
  const SEED = {
    users: [
      {
        id: 'TESTSTUD', pass: '112233', role: 'student',
        name: 'Alex Johnson', email: 'alex.johnson@campus.edu',
        dept: 'Computer Science', avatar: null,
        rewardPoints: 120
      },
      {
        id: 'TESTCOLLECTOR', pass: '112233', role: 'collector',
        name: 'Ravi Kumar', email: 'ravi.kumar@campus.edu',
        dept: 'Waste Management', avatar: null,
        rewardPoints: 0
      },
      {
        id: 'TESTADMIN', pass: '112233', role: 'admin',
        name: 'Dr. Priya Singh', email: 'admin@campus.edu',
        dept: 'Administration', avatar: null,
        rewardPoints: 0
      }
    ],
    complaints: [
      {
        id: 'WMS-0001',
        studentId: 'TESTSTUD',
        location: 'Block A - Ground Floor',
        wasteType: 'Mixed Waste',
        description: 'Large pile of garbage near the entrance. Needs immediate attention.',
        photo: null,
        status: 'completed',
        date: '2026-03-10',
        type: 'complaint'
      },
      {
        id: 'WMS-0002',
        studentId: 'TESTSTUD',
        location: 'Cafeteria East Wing',
        wasteType: 'Food Waste',
        description: 'Overflow of food waste from cafeteria bins.',
        photo: null,
        status: 'in-progress',
        date: '2026-03-13',
        type: 'complaint'
      },
      {
        id: 'WMS-0003',
        studentId: 'TESTSTUD',
        location: 'Library 2nd Floor',
        wasteType: 'Paper Waste',
        description: 'Scattered paper waste near the photocopier station.',
        photo: null,
        status: 'pending',
        date: '2026-03-15',
        type: 'complaint'
      }
    ],
    rewards: [
      { studentId: 'TESTSTUD', activity: 'Waste Photo Complaint', points: 50, date: '2026-03-10' },
      { studentId: 'TESTSTUD', activity: 'Dustbin Full Alert (Scan)', points: 30, date: '2026-03-12' },
      { studentId: 'TESTSTUD', activity: 'Waste Photo Complaint', points: 40, date: '2026-03-13' }
    ]
  };

  // ── Internal helpers ───────────────────────────────────────────────
  function load() {
    try { return JSON.parse(localStorage.getItem(STORE)) || null; }
    catch { return null; }
  }
  function save(db) { localStorage.setItem(STORE, JSON.stringify(db)); }

  function getDB() {
    let db = load();
    if (!db) {
      db = JSON.parse(JSON.stringify(SEED));
      save(db);
    }
    return db;
  }

  function genId() {
    const db = getDB();
    const n = db.complaints.length + 1;
    return 'WMS-' + String(n).padStart(4, '0');
  }

  // ── Auth ───────────────────────────────────────────────────────────
  function login(id, pass) {
    const db = getDB();
    const user = db.users.find(u => u.id === id && u.pass === pass);
    if (!user) return null;
    sessionStorage.setItem(SESSION, JSON.stringify(user));
    return user;
  }

  function logout() {
    sessionStorage.removeItem(SESSION);
    window.location.href = 'index.html';
  }

  function currentUser() {
    try { return JSON.parse(sessionStorage.getItem(SESSION)); }
    catch { return null; }
  }

  function requireAuth(role) {
    const u = currentUser();
    if (!u) { window.location.href = 'index.html'; return null; }
    if (role && u.role !== role) { window.location.href = 'index.html'; return null; }
    return u;
  }

  // ── Users ─────────────────────────────────────────────────────────
  function getUsers() { return getDB().users; }

  function getUserById(id) { return getDB().users.find(u => u.id === id) || null; }

  function createUser(data) {
    const db = getDB();
    if (db.users.find(u => u.id === data.id)) return { error: 'User ID already exists' };
    const user = {
      id: data.id, pass: data.pass, role: data.role,
      name: data.name, email: data.email,
      dept: data.dept || '', avatar: null, rewardPoints: 0
    };
    db.users.push(user);
    save(db);
    return { user };
  }

  function deleteUser(id) {
    const db = getDB();
    const idx = db.users.findIndex(u => u.id === id);
    if (idx === -1) return false;
    db.users.splice(idx, 1);
    save(db);
    return true;
  }

  function updateUser(id, fields) {
    const db = getDB();
    const idx = db.users.findIndex(u => u.id === id);
    if (idx === -1) return false;
    Object.assign(db.users[idx], fields);
    save(db);
    // refresh session if updating current user
    const sess = currentUser();
    if (sess && sess.id === id) {
      sessionStorage.setItem(SESSION, JSON.stringify(db.users[idx]));
    }
    return db.users[idx];
  }

  function changePassword(id, oldPass, newPass) {
    const db = getDB();
    const u = db.users.find(u => u.id === id);
    if (!u) return { error: 'User not found' };
    if (u.pass !== oldPass) return { error: 'Current password is incorrect' };
    u.pass = newPass;
    save(db);
    return { ok: true };
  }

  // ── Complaints ─────────────────────────────────────────────────────
  function getComplaints(filter) {
    let c = getDB().complaints;
    if (filter?.studentId) c = c.filter(x => x.studentId === filter.studentId);
    if (filter?.status)    c = c.filter(x => x.status === filter.status);
    return c.slice().reverse(); // newest first
  }

  function getComplaintById(id) { return getDB().complaints.find(c => c.id === id) || null; }

  function submitComplaint(data) {
    const db = getDB();
    const comp = {
      id: genId(),
      studentId: data.studentId,
      location: data.location,
      wasteType: data.wasteType,
      description: data.description,
      photo: data.photo || null,
      status: 'pending',
      date: new Date().toISOString().slice(0, 10),
      type: data.type || 'complaint'
    };
    db.complaints.push(comp);
    save(db);
    return comp;
  }

  function updateComplaintStatus(id, status, proofPhoto) {
    const db = getDB();
    const c = db.complaints.find(x => x.id === id);
    if (!c) return false;
    c.status = status;
    if (proofPhoto) c.proofPhoto = proofPhoto;
    save(db);
    return c;
  }

  // ── Rewards ────────────────────────────────────────────────────────
  function getRewards(studentId) {
    return getDB().rewards.filter(r => r.studentId === studentId).slice().reverse();
  }

  function addReward(studentId, activity, points) {
    const db = getDB();
    const reward = { studentId, activity, points, date: new Date().toISOString().slice(0, 10) };
    db.rewards.push(reward);
    // update user total
    const u = db.users.find(u => u.id === studentId);
    if (u) u.rewardPoints = (u.rewardPoints || 0) + Number(points);
    save(db);
    return reward;
  }

  // ── Stats ──────────────────────────────────────────────────────────
  function getStats() {
    const db = getDB();
    const c = db.complaints;
    return {
      total:    c.length,
      pending:  c.filter(x => x.status === 'pending').length,
      progress: c.filter(x => x.status === 'in-progress').length,
      done:     c.filter(x => x.status === 'completed').length,
      students: db.users.filter(u => u.role === 'student').length,
      collectors: db.users.filter(u => u.role === 'collector').length
    };
  }

  return {
    login, logout, currentUser, requireAuth,
    getUsers, getUserById, createUser, deleteUser, updateUser, changePassword,
    getComplaints, getComplaintById, submitComplaint, updateComplaintStatus,
    getRewards, addReward,
    getStats
  };
})();

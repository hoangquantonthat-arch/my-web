/* HUEIC College Lab Management System - local demo, vanilla JavaScript */
(() => {
  'use strict';

  const STORAGE_KEY = 'hueic_lab_management_demo_v1';
  const TODAY = new Date();
  const ROOM_STATUSES = ['Đang hoạt động', 'Đang bảo trì', 'Tạm ngưng'];
  const COMPUTER_STATUSES = ['Hoạt động tốt', 'Đang sử dụng', 'Bị hỏng', 'Đang sửa chữa', 'Đang bảo trì', 'Ngừng sử dụng'];
  const INCIDENT_STATUSES = ['Mới tiếp nhận', 'Đã tiếp nhận', 'Đang xử lý', 'Chờ linh kiện', 'Đã hoàn thành', 'Không thể sửa chữa'];
  const MAINTENANCE_STATUSES = ['Chưa thực hiện', 'Đang thực hiện', 'Đã hoàn thành', 'Quá hạn'];
  const ROLE_LABELS = {
    admin: 'Quản trị viên', manager: 'Cán bộ quản lý', technician: 'Kỹ thuật viên',
    lecturer_in_charge: 'Giảng viên phụ trách', lecturer: 'Giảng viên'
  };
  const ROLE_DESCRIPTIONS = {
    admin: 'Quản trị toàn hệ thống', manager: 'Quản lý phòng, thiết bị, lịch và báo cáo',
    technician: 'Xử lý sự cố và bảo trì', lecturer_in_charge: 'Quản lý thiết bị trong phòng được giao',
    lecturer: 'Xem tình trạng, lịch phòng và báo hỏng'
  };
  const STATUS_META = {
    'Hoạt động tốt': { cls: 'status-good', tile: 'good', color: '#1d9b69' },
    'Đang sử dụng': { cls: 'status-using', tile: 'using', color: '#347ac3' },
    'Bị hỏng': { cls: 'status-broken', tile: 'broken', color: '#d94e54' },
    'Đang sửa chữa': { cls: 'status-repair', tile: 'repair', color: '#d77b24' },
    'Đang bảo trì': { cls: 'status-maint', tile: 'maint', color: '#c9911c' },
    'Ngừng sử dụng': { cls: 'status-stopped', tile: 'stopped', color: '#8793a2' },
    'Mới tiếp nhận': { cls: 'status-open', color: '#cf6a2d' },
    'Đã tiếp nhận': { cls: 'status-neutral', color: '#718096' },
    'Đang xử lý': { cls: 'status-progress', color: '#347ac3' },
    'Chờ linh kiện': { cls: 'status-wait', color: '#c9911c' },
    'Đã hoàn thành': { cls: 'status-done', color: '#1d9b69' },
    'Không thể sửa chữa': { cls: 'status-broken', color: '#d94e54' },
    'Chưa thực hiện': { cls: 'status-neutral', color: '#8793a2' },
    'Đang thực hiện': { cls: 'status-progress', color: '#347ac3' },
    'Quá hạn': { cls: 'status-broken', color: '#d94e54' },
    'Đang hoạt động': { cls: 'status-done', color: '#1d9b69' },
    'Tạm ngưng': { cls: 'status-stopped', color: '#8793a2' }
  };

  let db = loadDatabase();
  let currentUserId = localStorage.getItem('hueic_current_user') || '';
  let currentPage = 'dashboard';
  let selectedRoomId = '';
  let deviceFilters = { search: '', room: 'all', status: 'all' };
  let incidentFilters = { search: '', status: 'all' };
  let maintenanceFilters = { status: 'all' };
  let reportFilters = { room: 'all', status: 'all', from: dateISO(-180), to: dateISO(0) };
  let dashboardFilters = { from: dateISO(-180), to: dateISO(0) };
  let selectedIncidentId = '';

  function dateISO(offsetDays = 0) {
    const d = new Date(); d.setDate(d.getDate() + offsetDays);
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
  }
  function dateTime(offsetDays, hour, minute = 0) {
    const d = new Date(); d.setDate(d.getDate() + offsetDays); d.setHours(hour, minute, 0, 0);
    const p = n => String(n).padStart(2,'0');
    return `${d.getFullYear()}-${p(d.getMonth()+1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
  }
  function uid(prefix) { return `${prefix}-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2,6).toUpperCase()}`; }
  function seedDatabase() {
    const roomSeed = [
      ['D2.401','Phòng thực hành D2.401','Tầng 4, dãy D2',24,'Nguyễn Văn An',20],
      ['D2.403','Phòng thực hành D2.403','Tầng 4, dãy D2',22,'Lê Quốc Bảo',18],
      ['D2.404','Phòng thực hành D2.404','Tầng 4, dãy D2',22,'Phạm Minh Châu',17],
      ['D2.405','Phòng thực hành D2.405','Tầng 4, dãy D2',24,'Hoàng Anh Dũng',16],
      ['D2.502','Phòng thực hành D2.502','Tầng 5, dãy D2',24,'Võ Thị Hà',21],
      ['D2.503','Phòng thực hành D2.503','Tầng 5, dãy D2',22,'Đặng Quang Huy',19],
      ['D2.504','Phòng thực hành D2.504','Tầng 5, dãy D2',24,'Nguyễn Thị Lan',18],
      ['D2.505','Phòng thực hành D2.505','Tầng 5, dãy D2',24,'Trần Minh Phúc',20]
    ];
    const rooms = roomSeed.map((r, i) => ({ id:`room-${i+1}`, code:r[0], name:r[1], location:r[2], capacity:r[3], manager:r[4], status:'Đang hoạt động', description:`Phòng thực hành máy tính ${r[0]} phục vụ giảng dạy và học tập.`, floor:i < 5 ? 'Tầng 4' : 'Tầng 5' }));
    const statuses = ['Hoạt động tốt','Hoạt động tốt','Hoạt động tốt','Đang sử dụng','Hoạt động tốt','Bị hỏng','Hoạt động tốt','Đang bảo trì','Hoạt động tốt','Hoạt động tốt','Đang sửa chữa','Hoạt động tốt','Đang sử dụng','Hoạt động tốt','Hoạt động tốt','Hoạt động tốt','Ngừng sử dụng','Hoạt động tốt','Hoạt động tốt','Hoạt động tốt','Hoạt động tốt','Hoạt động tốt'];
    const computers = [];
    roomSeed.forEach((r, roomIndex) => {
      for (let n = 1; n <= r[5]; n++) {
        const roomNo = r[0].split('.')[1];
        const status = statuses[(n * 3 + roomIndex * 2) % statuses.length];
        computers.push({
          id:`pc-${roomNo}-${String(n).padStart(2,'0')}`, code:`${r[0]}-${String(n).padStart(2,'0')}`,
          name:`Máy tính ${r[0]}-${String(n).padStart(2,'0')}`, roomId:rooms[roomIndex].id,
          position:`Dãy ${String.fromCharCode(65 + Math.floor((n-1)/5))} · Vị trí ${((n-1)%5)+1}`,
          cpu: roomIndex % 3 === 0 ? 'Intel Core i5-10400' : roomIndex % 3 === 1 ? 'Intel Core i5-8500' : 'Intel Core i3-10100',
          ram: roomIndex % 4 === 0 ? '16 GB' : '8 GB', storage: roomIndex % 2 === 0 ? 'SSD 512 GB' : 'SSD 256 GB',
          monitor: 'LCD 22 inch', os:'Windows 10 Pro 64-bit', deployedDate:`202${2 + (n%3)}-${String((n%12)+1).padStart(2,'0')}-15`,
          status, notes: status === 'Bị hỏng' ? 'Cần kiểm tra phần cứng.' : status === 'Đang bảo trì' ? 'Đang vệ sinh và kiểm tra định kỳ.' : ''
        });
      }
    });
    const users = [
      {id:'u-admin',name:'Nguyễn Hoàng Minh',username:'admin',password:'hueic123',role:'admin',assignedRoomId:'',active:true},
      {id:'u-manager',name:'Lê Thị Thanh',username:'manager',password:'hueic123',role:'manager',assignedRoomId:'',active:true},
      {id:'u-tech',name:'Trần Quốc Khánh',username:'technician',password:'hueic123',role:'technician',assignedRoomId:'',active:true},
      {id:'u-lecturer-charge',name:'Nguyễn Văn An',username:'gvphutrach',password:'hueic123',role:'lecturer_in_charge',assignedRoomId:'room-1',active:true},
      {id:'u-lecturer',name:'Phạm Thị Mai',username:'lecturer',password:'hueic123',role:'lecturer',assignedRoomId:'',active:true}
    ];
    const brokenPCs = computers.filter(c => c.status === 'Bị hỏng' || c.status === 'Đang sửa chữa').slice(0,6);
    const incidents = brokenPCs.map((pc,i) => ({
      id:`SC-${dateISO(-i*30).replaceAll('-','')}-${String(i+1).padStart(3,'0')}`, computerId:pc.id, roomId:pc.roomId,
      reportDate:dateISO(-i*30), reporter:i%2===0?'Phạm Thị Mai':'Nguyễn Văn An', description:['Máy không khởi động được.','Màn hình hiển thị chập chờn.','Máy chạy chậm, thường xuyên treo.','Bàn phím không nhận tín hiệu.','Không kết nối được mạng nội bộ.','Máy tự khởi động lại.'][i],
      priority:i===0?'Cao':i===1?'Trung bình':'Thấp', assignee:'Trần Quốc Khánh', receivedDate:dateISO(-i*30), completedDate:'', cost:0,
      status:['Đang xử lý','Mới tiếp nhận','Đã tiếp nhận','Chờ linh kiện','Đang xử lý','Mới tiếp nhận'][i], result:''
    }));
    const maintenances = [
      {id:'BT-202611-001',computerId:computers[0].id,roomId:rooms[0].id,title:'Vệ sinh máy và kiểm tra quạt tản nhiệt',dueDate:dateISO(2),assignee:'Trần Quốc Khánh',status:'Chưa thực hiện',result:'',cost:0},
      {id:'BT-202611-002',computerId:computers[12].id,roomId:rooms[0].id,title:'Kiểm tra ổ cứng và cập nhật hệ điều hành',dueDate:dateISO(-2),assignee:'Trần Quốc Khánh',status:'Quá hạn',result:'Chưa thực hiện',cost:0},
      {id:'BT-202611-003',computerId:'',roomId:rooms[2].id,title:'Bảo trì định kỳ toàn phòng',dueDate:dateISO(8),assignee:'Trần Quốc Khánh',status:'Chưa thực hiện',result:'',cost:0},
      {id:'BT-202611-004',computerId:computers[31].id,roomId:rooms[1].id,title:'Thay keo tản nhiệt CPU',dueDate:dateISO(-6),assignee:'Trần Quốc Khánh',status:'Đã hoàn thành',result:'Đã vệ sinh và thay keo tản nhiệt.',cost:180000}
    ];
    const schedules = [
      {id:'LS-001',roomId:rooms[0].id,className:'Thực hành Lập trình Web',teacher:'Nguyễn Văn An',start:dateTime(0,7,30),end:dateTime(0,10,0),notes:'Lớp CĐ CNTT K24'},
      {id:'LS-002',roomId:rooms[2].id,className:'Thực hành Cơ sở dữ liệu',teacher:'Phạm Thị Mai',start:dateTime(0,13,0),end:dateTime(0,16,0),notes:'Lớp CĐ CNTT K24'},
      {id:'LS-003',roomId:rooms[4].id,className:'Thực hành Mạng máy tính',teacher:'Lê Thị Thanh',start:dateTime(1,7,30),end:dateTime(1,11,0),notes:'Lớp CĐ CNTT K25'},
      {id:'LS-004',roomId:rooms[5].id,className:'Thực hành Tin học cơ bản',teacher:'Nguyễn Văn An',start:dateTime(2,13,0),end:dateTime(2,15,30),notes:'Lớp CĐ Kỹ thuật K25'}
    ];
    return {rooms,computers,incidents,maintenances,schedules,users,audit:[{id:uid('LOG'),user:'Hệ thống',action:'Khởi tạo dữ liệu demo',time:new Date().toISOString()}],notifications:[]};
  }
  function loadDatabase() {
    try { const raw = localStorage.getItem(STORAGE_KEY); if (raw) { const value = JSON.parse(raw); if (value && Array.isArray(value.rooms) && Array.isArray(value.computers)) return value; } } catch(e) { console.warn('Không đọc được dữ liệu demo, tạo dữ liệu mới.',e); }
    const fresh = seedDatabase(); localStorage.setItem(STORAGE_KEY, JSON.stringify(fresh)); return fresh;
  }
  function saveDatabase() { localStorage.setItem(STORAGE_KEY, JSON.stringify(db)); updateSidebarBadges(); }
  function esc(v='') { return String(v).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }
  function fmtDate(value) { if (!value) return '—'; const d = new Date(value.length===10 ? `${value}T00:00:00` : value); if (isNaN(d)) return value; return d.toLocaleDateString('vi-VN'); }
  function fmtDateTime(value) { if (!value) return '—'; const d=new Date(value); return isNaN(d)?value:d.toLocaleString('vi-VN',{day:'2-digit',month:'2-digit',year:'numeric',hour:'2-digit',minute:'2-digit'}); }
  function fmtMoney(v) { return Number(v||0).toLocaleString('vi-VN')+' đ'; }
  function roomById(id) { return db.rooms.find(r=>r.id===id); }
  function pcById(id) { return db.computers.find(c=>c.id===id); }
  function userById(id) { return db.users.find(u=>u.id===id); }
  function currentUser() { return userById(currentUserId); }
  function roomPCs(roomId) { return db.computers.filter(c=>c.roomId===roomId); }
  function roleName(role) { return ROLE_LABELS[role] || role; }
  function statusPill(status) { const m=STATUS_META[status]||{cls:'status-neutral'}; return `<span class="status-pill ${m.cls}">${esc(status)}</span>`; }
  function can(action, roomId='') {
    const u=currentUser(); if (!u) return false;
    if (u.role==='admin') return true;
    if (action==='view') return true;
    if (u.role==='manager') return ['manageRooms','manageComputers','manageSchedules','viewReports','manageIncidents'].includes(action);
    if (u.role==='technician') return ['manageIncidents','manageMaintenance'].includes(action);
    if (u.role==='lecturer_in_charge') {
      if (action==='reportIncident') return true;
      if (['manageRooms','manageComputers'].includes(action)) return !!roomId && roomId===u.assignedRoomId;
      return false;
    }
    if (u.role==='lecturer') return action==='reportIncident';
    return false;
  }
  function addAudit(action) {
    db.audit.unshift({id:uid('LOG'),user:currentUser()?.name||'Hệ thống',action,time:new Date().toISOString()});
    if (db.audit.length>100) db.audit.length=100;
  }
  function commit(message, type='success', auditText=message) { addAudit(auditText); saveDatabase(); renderPage(); toast(message,type); }
  function toast(message,type='success') { const root=document.getElementById('toast-root'); const el=document.createElement('div'); el.className=`toast ${type}`; el.textContent=message; root.appendChild(el); setTimeout(()=>el.remove(),3600); }
  function updateSidebarBadges() {
    const rooms=document.getElementById('nav-room-count'); if(rooms) rooms.textContent=String(db.rooms.length).padStart(2,'0');
    const inc=document.getElementById('nav-incident-count'); if(inc) inc.textContent=db.incidents.filter(i=>!['Đã hoàn thành','Không thể sửa chữa'].includes(i.status)).length;
  }
  function showLogin() { document.getElementById('app').classList.add('hidden'); document.getElementById('login-screen').classList.remove('hidden'); }
  function showApp() {
    const u=currentUser(); if(!u || !u.active) { currentUserId=''; localStorage.removeItem('hueic_current_user'); showLogin(); return; }
    document.getElementById('login-screen').classList.add('hidden'); document.getElementById('app').classList.remove('hidden');
    document.getElementById('profile-name').textContent=u.name; document.getElementById('profile-role').textContent=roleName(u.role);
    document.getElementById('profile-avatar').textContent=u.name.split(/\s+/).slice(-2).map(x=>x[0]).join('').toUpperCase();
    document.getElementById('current-date').textContent=new Date().toLocaleDateString('vi-VN',{weekday:'short',day:'2-digit',month:'short',year:'numeric'});
    document.querySelectorAll('[data-admin-only="true"]').forEach(el=>el.classList.toggle('hidden',u.role!=='admin'));
    document.querySelectorAll('[data-manager-only="true"]').forEach(el=>el.classList.toggle('hidden',!['admin','manager'].includes(u.role)));
    updateSidebarBadges(); renderPage();
  }
  function login(username,password) {
    const u=db.users.find(x=>x.username.toLowerCase()===username.toLowerCase() && x.password===password && x.active);
    if(!u) return false;
    currentUserId=u.id; localStorage.setItem('hueic_current_user',u.id); addAudit('Đăng nhập hệ thống'); saveDatabase(); showApp(); return true;
  }
  function navigate(page) {
    const u=currentUser(); if(!u) return;
    if(page==='accounts' && u.role!=='admin') { toast('Bạn không có quyền truy cập mục này.','error'); return; }
    if(page==='reports' && !['admin','manager'].includes(u.role)) { toast('Bạn không có quyền xem báo cáo.','error'); return; }
    currentPage=page; selectedRoomId=''; document.getElementById('profile-menu').classList.add('hidden');
    document.querySelectorAll('.nav-item').forEach(el=>el.classList.toggle('active',el.dataset.page===page));
    document.getElementById('breadcrumb-current').textContent=({dashboard:'Tổng quan',rooms:'Phòng thực hành',devices:'Thiết bị máy tính',incidents:'Sự cố & sửa chữa',maintenance:'Kế hoạch bảo trì',schedules:'Lịch sử dụng phòng',reports:'Báo cáo thống kê',accounts:'Tài khoản & nhật ký'})[page]||'Tổng quan';
    document.getElementById('sidebar').classList.remove('open'); renderPage();
  }
  function pageHeading(title,desc,actions='') { return `<div class="page-heading"><div><h1>${title}</h1><p>${desc}</p></div><div class="heading-actions">${actions}</div></div>`; }
  function renderPage() {
    const root=document.getElementById('page-content'); if(!root || !currentUser()) return;
    if(currentPage==='dashboard') root.innerHTML=renderDashboard();
    else if(currentPage==='rooms') root.innerHTML=selectedRoomId?renderRoomDetail(selectedRoomId):renderRooms();
    else if(currentPage==='devices') root.innerHTML=renderDevices();
    else if(currentPage==='incidents') root.innerHTML=renderIncidents();
    else if(currentPage==='maintenance') root.innerHTML=renderMaintenance();
    else if(currentPage==='schedules') root.innerHTML=renderSchedules();
    else if(currentPage==='reports') root.innerHTML=renderReports();
    else if(currentPage==='accounts') root.innerHTML=renderAccounts();
    updateSidebarBadges();
  }
  function statCard(label,value,icon,cls,foot='') { return `<div class="stat-card"><div class="stat-top"><span class="stat-label">${label}</span><span class="stat-icon ${cls}">${icon}</span></div><div class="stat-value">${value}</div><div class="stat-foot">${foot}</div></div>`; }
  function renderDashboard() {
    const total=db.computers.length, count=s=>db.computers.filter(c=>c.status===s).length;
    const good=count('Hoạt động tốt'), using=count('Đang sử dụng'), broken=count('Bị hỏng'), repair=count('Đang sửa chữa'), maint=count('Đang bảo trì');
    const openInc=db.incidents.filter(i=>!['Đã hoàn thành','Không thể sửa chữa'].includes(i.status)).length;
    const goodPct=total?Math.round(good/total*100):0;
    const nowTime=Date.now(); const activeRooms=new Set(db.schedules.filter(s=>new Date(s.start).getTime()<=nowTime&&new Date(s.end).getTime()>=nowTime).map(s=>s.roomId)).size;
    const roomUse=db.schedules.filter(s=>new Date(s.start).toDateString()===new Date().toDateString()).length;
    const bars=db.rooms.map(r=>{const pcs=roomPCs(r.id);return {label:r.code.replace('D2.',''),good:pcs.filter(c=>['Hoạt động tốt','Đang sử dụng'].includes(c.status)).length,bad:pcs.filter(c=>['Bị hỏng','Đang sửa chữa','Đang bảo trì','Ngừng sử dụng'].includes(c.status)).length,total:pcs.length};});
    const max=Math.max(1,...bars.map(x=>x.total));
    const activity=db.audit.slice(0,5);
    const monthly=[]; const now=new Date();
    for(let k=5;k>=0;k--){const d=new Date(now.getFullYear(),now.getMonth()-k,1);const key=`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;monthly.push({key,label:d.toLocaleDateString('vi-VN',{month:'short'}),count:db.incidents.filter(i=>(i.reportDate||'').startsWith(key)&&i.reportDate>=dashboardFilters.from&&i.reportDate<=dashboardFilters.to).length});}
    const monthMax=Math.max(1,...monthly.map(x=>x.count));
    const scheduled=db.schedules.filter(s=>s.start.slice(0,10)>=dashboardFilters.from&&s.start.slice(0,10)<=dashboardFilters.to);
    const roomUsage=db.rooms.map(r=>({label:r.code.replace('D2.',''),count:scheduled.filter(s=>s.roomId===r.id).length})); const usageMax=Math.max(1,...roomUsage.map(x=>x.count));
    const teacherUsage=Object.entries(scheduled.reduce((acc,s)=>{acc[s.teacher]=(acc[s.teacher]||0)+1;return acc;},{})).sort((a,b)=>b[1]-a[1]); const teacherMax=Math.max(1,...teacherUsage.map(x=>x[1]));
    return `${pageHeading('Tổng quan hệ thống','Theo dõi nhanh tình trạng cơ sở vật chất và hoạt động phòng thực hành.',`<button class="btn outline" data-action="refresh-data">↻ Làm mới dữ liệu</button><button class="btn primary" data-action="open-incident">＋ Tạo phiếu báo hỏng</button>`)}
      <div class="toolbar dashboard-period"><label class="period-label">Từ ngày <input type="date" value="${dashboardFilters.from}" onchange="window.__filterDashboard('from',this.value)"></label><label class="period-label">Đến ngày <input type="date" value="${dashboardFilters.to}" onchange="window.__filterDashboard('to',this.value)"></label><span class="filter-summary">Khoảng thời gian áp dụng cho biểu đồ sự cố và lịch khai thác</span></div>
      <div class="stats-grid">
        ${statCard('TỔNG SỐ PHÒNG',db.rooms.length,'▤','icon-orange',`<strong>${db.rooms.filter(r=>r.status==='Đang hoạt động').length}</strong> phòng đang hoạt động`)}
        ${statCard('TỔNG SỐ MÁY TÍNH',total,'▣','icon-blue',`Phân bổ tại <strong>${db.rooms.length}</strong> phòng thực hành`)}
        ${statCard('MÁY HOẠT ĐỘNG TỐT',good,'✓','icon-green',`Tỷ lệ sẵn sàng <strong>${goodPct}%</strong>`)}
        ${statCard('MÁY ĐANG SỬ DỤNG',using,'⌁','icon-blue','Đang phục vụ giờ học')}
        ${statCard('MÁY BỊ HỎNG',broken,'⚑','icon-red','Cần được kiểm tra và xử lý')}
        ${statCard('MÁY ĐANG SỬA CHỮA',repair,'⚒','icon-orange','Đang trong quy trình khắc phục')}
        ${statCard('MÁY ĐANG BẢO TRÌ',maint,'⚙','icon-yellow','Đang được bảo dưỡng định kỳ')}
        ${statCard('SỰ CỐ CHƯA XỬ LÝ',openInc,'!','icon-red',`<strong>${db.incidents.length}</strong> phiếu sự cố trong hệ thống`)}
        ${statCard('TỶ LỆ MÁY HOẠT ĐỘNG TỐT',goodPct+'%','↗','icon-green','Tính trên tổng số máy tính') }
        ${statCard('PHÒNG ĐANG ĐƯỢC SỬ DỤNG',activeRooms,'◷','icon-orange','Dựa trên lịch đang diễn ra') }
      </div>
      <div class="dashboard-grid">
        <section class="panel"><div class="panel-head"><div><div class="panel-title">Tình trạng thiết bị theo phòng</div><div class="panel-subtitle">Phân bổ máy sẵn sàng và máy cần xử lý</div></div><button class="panel-action" data-nav="rooms">Xem phòng →</button></div>
          <div class="chart-bars">${bars.map(b=>`<div class="chart-col"><div class="bar-stack" title="${b.label}: ${b.good} máy sẵn sàng, ${b.bad} máy cần xử lý"><div class="bar-segment" style="height:${b.total?b.bad/b.total*100:0}%;background:#f4a45f"></div><div class="bar-segment" style="height:${b.total?b.good/b.total*100:0}%;background:#38a879"></div></div><span class="chart-label">${b.label}</span></div>`).join('')}</div>
          <div class="chart-legend"><span class="legend-item"><i class="legend-dot" style="background:#38a879"></i>Máy tốt / đang sử dụng</span><span class="legend-item"><i class="legend-dot" style="background:#f4a45f"></i>Máy cần xử lý</span></div>
        </section>
        <section class="panel"><div class="panel-head"><div><div class="panel-title">Tỷ lệ tình trạng máy</div><div class="panel-subtitle">Tổng số ${total} thiết bị</div></div></div>
          <div class="donut-wrap"><div class="donut" style="background:conic-gradient(#1d9b69 0 ${good/Math.max(1,total)*100}%,#347ac3 ${good/Math.max(1,total)*100}% ${(good+using)/Math.max(1,total)*100}%,#d94e54 ${(good+using)/Math.max(1,total)*100}% ${(good+using+broken)/Math.max(1,total)*100}%,#f28a32 ${(good+using+broken)/Math.max(1,total)*100}% ${(good+using+broken+repair)/Math.max(1,total)*100}%,#d3a63e ${(good+using+broken+repair)/Math.max(1,total)*100}% ${(good+using+broken+repair+maint)/Math.max(1,total)*100}%,#aab3bd ${(good+using+broken+repair+maint)/Math.max(1,total)*100}% 100%)"><div class="donut-center"><strong>${total}</strong><span>Thiết bị</span></div></div>
            <div class="donut-legend">${[['Hoạt động tốt',good],['Đang sử dụng',using],['Bị hỏng',broken],['Đang sửa chữa',repair],['Đang bảo trì',maint],['Ngừng sử dụng',count('Ngừng sử dụng')]].map(([s,n])=>`<div class="donut-legend-row"><i class="legend-dot" style="background:${STATUS_META[s].color}"></i><span>${s}</span><b>${n}</b></div>`).join('')}</div></div>
        </section>
      </div>
      <div class="dashboard-grid">
        <section class="panel"><div class="panel-head"><div><div class="panel-title">Lịch sử hoạt động gần đây</div><div class="panel-subtitle">Các thao tác mới nhất được ghi nhận trong demo</div></div><button class="panel-action" data-nav="accounts">Nhật ký →</button></div>
          <div class="activity-list">${activity.length?activity.map(a=>`<div class="activity-row"><div class="activity-symbol icon-blue">◷</div><div class="activity-copy"><b>${esc(a.action)}</b><span>${esc(a.user)}</span></div><time class="activity-time">${fmtDateTime(a.time)}</time></div>`).join(''):'<div class="empty-state">Chưa có hoạt động.</div>'}</div>
        </section>
        <section class="panel"><div class="panel-head"><div><div class="panel-title">Thông tin khai thác phòng</div><div class="panel-subtitle">Lịch sử dụng trong ngày hôm nay</div></div><button class="panel-action" data-nav="schedules">Mở lịch →</button></div>
          <div class="stat-value" style="font-size:35px;margin:22px 0 4px">${roomUse}</div><div class="muted" style="font-size:9px">Lịch sử dụng được xếp trong ngày</div><div class="notice-banner" style="margin:18px 0 0">ⓘ Dữ liệu trên Dashboard được tính từ dữ liệu demo đang lưu trong trình duyệt.</div>
        </section>
      </div>
      <div class="dashboard-grid dashboard-trends">
        <section class="panel"><div class="panel-head"><div><div class="panel-title">Sự cố theo tháng</div><div class="panel-subtitle">Số phiếu được ghi nhận trong 6 tháng gần đây</div></div></div><div class="simple-bars">${monthly.map(x=>`<div class="simple-bar-row"><span>${x.label}</span><div class="simple-bar-track"><span style="width:${x.count/monthMax*100}%;background:#e9954c"></span></div><b>${x.count}</b></div>`).join('')}</div></section>
        <section class="panel"><div class="panel-head"><div><div class="panel-title">Lịch sử khai thác phòng</div><div class="panel-subtitle">Số lịch được ghi nhận theo phòng</div></div></div><div class="simple-bars">${roomUsage.map(x=>`<div class="simple-bar-row"><span>${x.label}</span><div class="simple-bar-track"><span style="width:${x.count/usageMax*100}%;background:#347ac3"></span></div><b>${x.count}</b></div>`).join('')}</div></section>
        <section class="panel"><div class="panel-head"><div><div class="panel-title">Tần suất phụ trách theo giảng viên</div><div class="panel-subtitle">Đếm lịch giảng dạy, chưa phải xếp hạng hiệu quả</div></div></div><div class="simple-bars">${teacherUsage.length?teacherUsage.map(([name,n])=>`<div class="simple-bar-row"><span title="${esc(name)}">${esc(name.split(' ').slice(-2).join(' '))}</span><div class="simple-bar-track"><span style="width:${n/teacherMax*100}%;background:#269a70"></span></div><b>${n}</b></div>`).join(''):'<div class="muted" style="font-size:9px">Chưa có lịch trong khoảng thời gian.</div>'}</div></section>
      </div>
      <div class="quick-grid"><button class="quick-action" data-action="open-room-form"><span class="quick-icon">＋</span><span><b>Thêm phòng mới</b><small>Khởi tạo không gian học tập</small></span></button><button class="quick-action" data-action="open-computer-form"><span class="quick-icon">▣</span><span><b>Thêm thiết bị</b><small>Cập nhật máy tính mới</small></span></button><button class="quick-action" data-action="open-incident"><span class="quick-icon">⚑</span><span><b>Báo cáo sự cố</b><small>Gửi yêu cầu hỗ trợ kỹ thuật</small></span></button><button class="quick-action" data-nav="reports"><span class="quick-icon">▥</span><span><b>Xem báo cáo</b><small>Phân tích tình trạng thiết bị</small></span></button></div>`;
  }
  function renderRooms() {
    const canAdd=can('manageRooms');
    return `${pageHeading('Quản lý phòng thực hành','Danh sách không gian thực hành và tình trạng khai thác.',`${canAdd?'<button class="btn primary" data-action="open-room-form">＋ Thêm phòng mới</button>':''}`)}
      <div class="toolbar"><div class="toolbar-search"><input id="room-search" placeholder="Tìm theo mã phòng, tên phòng, người phụ trách..." oninput="window.__filterRooms(this.value)" /></div><span class="filter-summary">${db.rooms.length} phòng trong hệ thống</span></div>
      <div id="room-grid" class="room-grid">${renderRoomCards(db.rooms)}</div>`;
  }
  function renderRoomCards(rooms) {
    return rooms.map(r=>{const pcs=roomPCs(r.id), ready=pcs.filter(c=>['Hoạt động tốt','Đang sử dụng'].includes(c.status)).length, pct=pcs.length?Math.round(ready/pcs.length*100):0;
      return `<article class="room-card"><div class="room-card-head"><div><div class="room-code">${esc(r.code)}</div><div class="room-name">${esc(r.name)}</div></div><span class="room-occupancy">${pcs.length}/${r.capacity} chỗ</span></div><div class="room-progress"><span style="width:${pct}%"></span></div><div class="room-card-stats"><span>${pcs.length} máy tính</span><b>${pct}% sẵn sàng</b></div><div class="room-meta"><div><small>VỊ TRÍ</small><b>${esc(r.location)}</b></div><div><small>NGƯỜI PHỤ TRÁCH</small><b>${esc(r.manager)}</b></div></div><div class="room-card-footer"><button class="btn secondary small" data-action="open-room" data-id="${r.id}">Sơ đồ máy →</button>${can('manageRooms',r.id)?`<button class="btn outline small" data-action="edit-room" data-id="${r.id}">Sửa</button><button class="btn outline small" data-action="delete-room" data-id="${r.id}" title="Xóa phòng">×</button>`:''}</div></article>`;
    }).join('') || '<div class="empty-state">Không tìm thấy phòng phù hợp.</div>';
  }
  function renderRoomDetail(roomId) {
    const r=roomById(roomId); if(!r){selectedRoomId='';return renderRooms();}
    const pcs=roomPCs(roomId), canManage=can('manageComputers',roomId), good=pcs.filter(c=>['Hoạt động tốt','Đang sử dụng'].includes(c.status)).length;
    return `<div class="detail-hero"><button class="back-link" data-action="back-rooms">← Danh sách phòng</button><div><h2>${esc(r.code)} · ${esc(r.name)}</h2><p>${esc(r.location)} · Người phụ trách: ${esc(r.manager)}</p></div><div style="margin-left:auto;display:flex;gap:7px">${canManage?`<button class="btn outline small" data-action="edit-room" data-id="${r.id}">Sửa phòng</button><button class="btn primary small" data-action="open-computer-form" data-room-id="${r.id}">＋ Thêm máy</button>`:''}</div></div>
      <div class="notice-banner">ℹ <span>Sơ đồ bố trí máy tính của phòng. Chọn một máy để xem cấu hình, cập nhật trạng thái hoặc tạo phiếu báo hỏng.</span></div>
      <div class="computer-layout"><section class="panel"><div class="panel-head"><div><div class="panel-title">Sơ đồ máy tính · ${pcs.length} thiết bị</div><div class="panel-subtitle">${good} máy tốt hoặc đang sử dụng · Sắp xếp theo vị trí</div></div><span class="heading-meta">SỨC CHỨA <b>${r.capacity}</b></span></div>
        <div class="computer-grid">${pcs.map(pc=>{const m=STATUS_META[pc.status];return `<button class="computer-tile ${m.tile}" data-action="view-computer" data-id="${pc.id}"><span class="pc-screen"></span><strong>${esc(pc.code)}</strong><small>${esc(pc.status)}</small></button>`;}).join('')||'<div class="empty-state">Phòng chưa có thiết bị.</div>'}</div>
        <div class="computer-key" style="margin-top:20px">${COMPUTER_STATUSES.map(s=>`<span><i style="background:${STATUS_META[s].color}"></i>${s}</span>`).join('')}</div>
      </section><aside class="room-side-info"><div class="mini-info-card"><h3>Thông tin phòng</h3><div class="mini-info-line"><span>Mã phòng</span><b>${esc(r.code)}</b></div><div class="mini-info-line"><span>Sức chứa</span><b>${r.capacity} người</b></div><div class="mini-info-line"><span>Thiết bị</span><b>${pcs.length} máy</b></div><div class="mini-info-line"><span>Tình trạng phòng</span><b>${statusPill(r.status)}</b></div><div class="mini-info-line"><span>Vị trí</span><b>${esc(r.location)}</b></div></div><div class="mini-info-card"><h3>Thống kê thiết bị</h3>${COMPUTER_STATUSES.map(s=>`<div class="mini-info-line"><span>${s}</span><b>${pcs.filter(c=>c.status===s).length}</b></div>`).join('')}</div><div class="mini-info-card"><h3>Thông tin bổ sung</h3><div class="muted" style="font-size:8px;line-height:1.7">${esc(r.description||'Chưa có mô tả.')}</div></div></aside></div>`;
  }
  function renderDevices() {
    const items=db.computers.filter(c=>(deviceFilters.search===''||`${c.code} ${c.name} ${c.cpu}`.toLowerCase().includes(deviceFilters.search.toLowerCase()))&&(deviceFilters.room==='all'||c.roomId===deviceFilters.room)&&(deviceFilters.status==='all'||c.status===deviceFilters.status));
    const canAdd=can('manageComputers');
    return `${pageHeading('Quản lý thiết bị máy tính','Theo dõi cấu hình, vị trí và trạng thái toàn bộ máy tính.',`${canAdd?'<button class="btn outline" data-action="import-csv">↑ Nhập CSV</button><button class="btn outline" data-action="export-csv">↓ Xuất CSV</button><button class="btn primary" data-action="open-computer-form">＋ Thêm thiết bị</button>':''}`)}
      <div class="toolbar"><div class="toolbar-search"><input placeholder="Tìm mã máy, tên máy, cấu hình..." value="${esc(deviceFilters.search)}" oninput="window.__filterDevices('search',this.value)" /></div><select class="toolbar-select" onchange="window.__filterDevices('room',this.value)"><option value="all">Tất cả phòng</option>${db.rooms.map(r=>`<option value="${r.id}" ${deviceFilters.room===r.id?'selected':''}>${esc(r.code)}</option>`).join('')}</select><select class="toolbar-select" onchange="window.__filterDevices('status',this.value)"><option value="all">Tất cả trạng thái</option>${COMPUTER_STATUSES.map(s=>`<option ${deviceFilters.status===s?'selected':''}>${s}</option>`).join('')}</select><span class="filter-summary">Hiển thị ${items.length}/${db.computers.length} máy</span></div>
      <section class="panel table-panel"><div class="table-wrap"><table><thead><tr><th>STT</th><th>MÃ MÁY / TÊN THIẾT BỊ</th><th>PHÒNG</th><th>CẤU HÌNH</th><th>NGÀY SỬ DỤNG</th><th>TÌNH TRẠNG</th><th>NGƯỜI PHỤ TRÁCH</th><th>THAO TÁC</th></tr></thead><tbody>${items.map((c,i)=>{const r=roomById(c.roomId);return `<tr><td>${i+1}</td><td><div class="td-primary">${esc(c.code)}</div><div class="td-sub">${esc(c.name)}</div></td><td>${r?esc(r.code):'—'}</td><td><div class="td-primary">${esc(c.cpu)}</div><div class="td-sub">${esc(c.ram)} · ${esc(c.storage)}</div></td><td>${fmtDate(c.deployedDate)}</td><td>${statusPill(c.status)}</td><td>${esc(r?.manager||'—')}</td><td><div class="row-actions"><button class="row-action" title="Chi tiết" data-action="view-computer" data-id="${c.id}">⌕</button>${can('manageComputers',c.roomId)?`<button class="row-action" title="Chỉnh sửa" data-action="edit-computer" data-id="${c.id}">✎</button><button class="row-action" title="Xóa" data-action="delete-computer" data-id="${c.id}">×</button>`:''}</div></td></tr>`;}).join('')||'<tr><td colspan="8"><div class="empty-state">Không tìm thấy thiết bị phù hợp.</div></td></tr>'}</tbody></table></div><div class="pagination"><span>Danh sách thiết bị · ${items.length} bản ghi</span><span>Dữ liệu demo lưu cục bộ</span></div></section>`;
  }
  function renderIncidents() {
    const items=db.incidents.filter(i=>(incidentFilters.search===''||`${i.id} ${i.description} ${pcById(i.computerId)?.code||''}`.toLowerCase().includes(incidentFilters.search.toLowerCase()))&&(incidentFilters.status==='all'||i.status===incidentFilters.status)).sort((a,b)=>b.reportDate.localeCompare(a.reportDate));
    return `${pageHeading('Sự cố & sửa chữa','Tiếp nhận báo hỏng, phân công kỹ thuật và theo dõi tiến độ.',`<button class="btn primary" data-action="open-incident">＋ Tạo phiếu báo hỏng</button>`)}
      <div class="stats-grid" style="grid-template-columns:repeat(4,1fr)">${statCard('MỚI TIẾP NHẬN',db.incidents.filter(i=>i.status==='Mới tiếp nhận').length,'⚑','icon-orange')}${statCard('ĐANG XỬ LÝ',db.incidents.filter(i=>['Đã tiếp nhận','Đang xử lý'].includes(i.status)).length,'⚒','icon-blue')}${statCard('CHỜ LINH KIỆN',db.incidents.filter(i=>i.status==='Chờ linh kiện').length,'◷','icon-yellow')}${statCard('ĐÃ HOÀN THÀNH',db.incidents.filter(i=>i.status==='Đã hoàn thành').length,'✓','icon-green')}</div>
      <div class="toolbar"><div class="toolbar-search"><input placeholder="Tìm mã sự cố, mã máy, mô tả..." value="${esc(incidentFilters.search)}" oninput="window.__filterIncidents('search',this.value)" /></div><select class="toolbar-select" onchange="window.__filterIncidents('status',this.value)"><option value="all">Tất cả trạng thái</option>${INCIDENT_STATUSES.map(s=>`<option ${incidentFilters.status===s?'selected':''}>${s}</option>`).join('')}</select><span class="filter-summary">${items.length} phiếu sự cố</span></div>
      <section class="panel table-panel"><div class="table-wrap"><table><thead><tr><th>MÃ SỰ CỐ</th><th>NGÀY BÁO</th><th>PHÒNG / MÁY</th><th>MÔ TẢ SỰ CỐ</th><th>ƯU TIÊN</th><th>NGƯỜI XỬ LÝ</th><th>TRẠNG THÁI</th><th>THAO TÁC</th></tr></thead><tbody>${items.map(i=>{const pc=pcById(i.computerId),r=roomById(i.roomId);return `<tr><td><div class="td-primary">${esc(i.id)}</div></td><td>${fmtDate(i.reportDate)}</td><td><div class="td-primary">${esc(r?.code||'—')}</div><div class="td-sub">${esc(pc?.code||'Chưa chọn máy')}</div></td><td style="max-width:210px"><div>${esc(i.description)}</div><div class="td-sub">Người báo: ${esc(i.reporter)}</div></td><td><span class="status-pill ${i.priority==='Cao'?'status-broken':i.priority==='Trung bình'?'status-wait':'status-neutral'}">${esc(i.priority)}</span></td><td>${esc(i.assignee||'Chưa phân công')}</td><td>${statusPill(i.status)}</td><td><div class="row-actions"><button class="row-action" title="Chi tiết / cập nhật" data-action="edit-incident" data-id="${i.id}">✎</button></div></td></tr>`;}).join('')||'<tr><td colspan="8"><div class="empty-state">Chưa có phiếu sự cố phù hợp.</div></td></tr>'}</tbody></table></div><div class="pagination"><span>Tổng cộng ${db.incidents.length} phiếu</span><span>Cập nhật trạng thái trong chi tiết phiếu</span></div></section>`;
  }
  function renderMaintenance() {
    const items=db.maintenances.filter(m=>maintenanceFilters.status==='all'||m.status===maintenanceFilters.status).sort((a,b)=>a.dueDate.localeCompare(b.dueDate));
    const due=db.maintenances.filter(m=>m.status!=='Đã hoàn thành'&&m.dueDate<=dateISO(7)).length;
    return `${pageHeading('Quản lý bảo trì','Lập kế hoạch bảo dưỡng và theo dõi lịch bảo trì thiết bị.',`${can('manageMaintenance')?'<button class="btn primary" data-action="open-maintenance">＋ Tạo kế hoạch</button>':''}`)}
      <div class="notice-banner">⚙ <span><b>${due} kế hoạch</b> đến hạn hoặc cần thực hiện trong 7 ngày tới. Hãy ưu tiên xử lý các thiết bị quá hạn để giảm nguy cơ gián đoạn giờ học.</span></div>
      <div class="toolbar"><select class="toolbar-select" onchange="window.__filterMaintenance(this.value)"><option value="all">Tất cả trạng thái</option>${MAINTENANCE_STATUSES.map(s=>`<option ${maintenanceFilters.status===s?'selected':''}>${s}</option>`).join('')}</select><span class="filter-summary">${items.length} kế hoạch bảo trì</span></div>
      <section class="panel table-panel"><div class="table-wrap"><table><thead><tr><th>MÃ KẾ HOẠCH</th><th>THIẾT BỊ / PHÒNG</th><th>NỘI DUNG BẢO TRÌ</th><th>NGÀY DỰ KIẾN</th><th>NGƯỜI THỰC HIỆN</th><th>CHI PHÍ</th><th>TRẠNG THÁI</th><th>THAO TÁC</th></tr></thead><tbody>${items.map(m=>{const pc=pcById(m.computerId),r=roomById(m.roomId);return `<tr><td><div class="td-primary">${esc(m.id)}</div></td><td><div class="td-primary">${pc?esc(pc.code):'Toàn phòng'}</div><div class="td-sub">${esc(r?.code||'—')}</div></td><td>${esc(m.title)}</td><td>${fmtDate(m.dueDate)}</td><td>${esc(m.assignee||'Chưa phân công')}</td><td>${fmtMoney(m.cost)}</td><td>${statusPill(m.status)}</td><td><div class="row-actions">${(can('manageMaintenance')||can('manageComputers',m.roomId))?`<button class="row-action" title="Cập nhật" data-action="edit-maintenance" data-id="${m.id}">✎</button>`:'—'}</div></td></tr>`;}).join('')||'<tr><td colspan="8"><div class="empty-state">Chưa có kế hoạch phù hợp.</div></td></tr>'}</tbody></table></div><div class="pagination"><span>Tổng cộng ${db.maintenances.length} kế hoạch</span><span>Thông báo hạn bảo trì được mô phỏng trong Dashboard</span></div></section>`;
  }
  function renderSchedules() {
    const items=[...db.schedules].sort((a,b)=>a.start.localeCompare(b.start));
    return `${pageHeading('Lịch sử dụng phòng','Theo dõi kế hoạch khai thác và hạn chế xung đột lịch thực hành.',`${can('manageSchedules')?'<button class="btn primary" data-action="open-schedule">＋ Tạo lịch sử dụng</button>':''}`)}
      <div class="notice-banner">◷ <span>Lịch chỉ được tạo khi thời gian bắt đầu trước thời gian kết thúc và không trùng với một lịch khác của cùng phòng.</span></div>
      <section class="panel table-panel"><div class="table-wrap"><table><thead><tr><th>NGÀY / THỜI GIAN</th><th>PHÒNG</th><th>LỚP / NỘI DUNG</th><th>GIẢNG VIÊN</th><th>GHI CHÚ</th><th>THAO TÁC</th></tr></thead><tbody>${items.map(s=>{const r=roomById(s.roomId);return `<tr><td><div class="td-primary">${fmtDate(s.start)}</div><div class="td-sub">${new Date(s.start).toLocaleTimeString('vi-VN',{hour:'2-digit',minute:'2-digit'})} – ${new Date(s.end).toLocaleTimeString('vi-VN',{hour:'2-digit',minute:'2-digit'})}</div></td><td><b>${esc(r?.code||'—')}</b></td><td>${esc(s.className)}</td><td>${esc(s.teacher)}</td><td>${esc(s.notes||'—')}</td><td>${can('manageSchedules')?`<div class="row-actions"><button class="row-action" data-action="edit-schedule" data-id="${s.id}" title="Sửa">✎</button><button class="row-action" data-action="delete-schedule" data-id="${s.id}" title="Xóa">×</button></div>`:'—'}</td></tr>`;}).join('')||'<tr><td colspan="6"><div class="empty-state">Chưa có lịch sử dụng.</div></td></tr>'}</tbody></table></div><div class="pagination"><span>${items.length} lịch sử dụng phòng</span><span>Kiểm tra trùng lịch tự động khi lưu</span></div></section>`;
  }
  function renderReports() {
    const pcs=db.computers.filter(c=>(reportFilters.room==='all'||c.roomId===reportFilters.room)&&(reportFilters.status==='all'||c.status===reportFilters.status));
    const counts=COMPUTER_STATUSES.map(s=>({s,n:pcs.filter(c=>c.status===s).length}));
    const max=Math.max(1,...counts.map(x=>x.n));
    const periodIncidents=db.incidents.filter(i=>i.reportDate>=reportFilters.from&&i.reportDate<=reportFilters.to&&(reportFilters.room==='all'||i.roomId===reportFilters.room));
    const periodMaintenance=db.maintenances.filter(m=>m.dueDate>=reportFilters.from&&m.dueDate<=reportFilters.to&&(reportFilters.room==='all'||m.roomId===reportFilters.room));
    const costs=periodMaintenance.reduce((a,b)=>a+Number(b.cost||0),0)+periodIncidents.reduce((a,b)=>a+Number(b.cost||0),0);
    const rooms=db.rooms.filter(r=>reportFilters.room==='all'||r.id===reportFilters.room).map(r=>({r,n:roomPCs(r.id).filter(c=>['Hoạt động tốt','Đang sử dụng'].includes(c.status)).length,total:roomPCs(r.id).length}));
    return `${pageHeading('Báo cáo & thống kê','Tổng hợp tình trạng thiết bị, sửa chữa và chi phí vận hành.',`<button class="btn outline" data-action="print-report">▤ In / PDF</button><button class="btn outline" data-action="export-report">↓ Xuất báo cáo CSV</button>`)}
      <div class="toolbar"><label class="period-label">Từ ngày <input type="date" value="${reportFilters.from}" onchange="window.__filterReport('from',this.value)"></label><label class="period-label">Đến ngày <input type="date" value="${reportFilters.to}" onchange="window.__filterReport('to',this.value)"></label><select class="toolbar-select" onchange="window.__filterReport('room',this.value)"><option value="all">Tất cả phòng</option>${db.rooms.map(r=>`<option value="${r.id}" ${reportFilters.room===r.id?'selected':''}>${esc(r.code)}</option>`).join('')}</select><select class="toolbar-select" onchange="window.__filterReport('status',this.value)"><option value="all">Tất cả tình trạng</option>${COMPUTER_STATUSES.map(s=>`<option ${reportFilters.status===s?'selected':''}>${s}</option>`).join('')}</select><span class="filter-summary">${pcs.length} thiết bị · ${periodIncidents.length} sự cố trong phạm vi lọc</span></div>
      <div class="stats-grid">${statCard('THIẾT BỊ TRONG BÁO CÁO',pcs.length,'▣','icon-blue')}${statCard('MÁY SẴN SÀNG',pcs.filter(c=>['Hoạt động tốt','Đang sử dụng'].includes(c.status)).length,'✓','icon-green')}${statCard('PHIẾU SỰ CỐ',periodIncidents.length,'⚑','icon-orange')}${statCard('TỔNG CHI PHÍ GHI NHẬN',fmtMoney(costs),'₫','icon-yellow')}</div>
      <div class="report-grid"><section class="panel"><div class="panel-head"><div><div class="panel-title">Tổng hợp tình trạng thiết bị</div><div class="panel-subtitle">Theo bộ lọc hiện tại</div></div></div><div class="simple-bars">${counts.map(x=>`<div class="simple-bar-row"><span>${x.s}</span><div class="simple-bar-track"><span style="width:${x.n/max*100}%;background:${STATUS_META[x.s].color}"></span></div><b>${x.n}</b></div>`).join('')}</div></section>
      <section class="panel"><div class="panel-head"><div><div class="panel-title">Tình trạng máy theo phòng</div><div class="panel-subtitle">Máy tốt hoặc đang sử dụng / tổng số máy</div></div></div>${rooms.map(x=>`<div class="report-metric"><span>${esc(x.r.code)}</span><b>${x.n}/${x.total} máy (${x.total?Math.round(x.n/x.total*100):0}%)</b></div>`).join('')}</section>
      <section class="panel"><div class="panel-head"><div><div class="panel-title">Hiệu quả xử lý sự cố</div><div class="panel-subtitle">Theo các phiếu đã ghi nhận</div></div></div>${[['Tổng phiếu',periodIncidents.length],['Đã hoàn thành',periodIncidents.filter(i=>i.status==='Đã hoàn thành').length],['Đang xử lý',periodIncidents.filter(i=>['Đã tiếp nhận','Đang xử lý','Chờ linh kiện'].includes(i.status)).length],['Không thể sửa chữa',periodIncidents.filter(i=>i.status==='Không thể sửa chữa').length]].map(x=>`<div class="report-metric"><span>${x[0]}</span><b>${x[1]}</b></div>`).join('')}</section>
      <section class="panel"><div class="panel-head"><div><div class="panel-title">Chi phí & bảo trì</div><div class="panel-subtitle">Dữ liệu tổng hợp đã nhập</div></div></div>${[['Chi phí sửa chữa',fmtMoney(periodIncidents.reduce((a,b)=>a+Number(b.cost||0),0))],['Chi phí bảo trì',fmtMoney(periodMaintenance.reduce((a,b)=>a+Number(b.cost||0),0))],['Kế hoạch bảo trì',periodMaintenance.length],['Đến hạn trong 7 ngày',periodMaintenance.filter(m=>m.status!=='Đã hoàn thành'&&m.dueDate<=dateISO(7)).length]].map(x=>`<div class="report-metric"><span>${x[0]}</span><b>${x[1]}</b></div>`).join('')}</section></div>
      <div class="notice-banner" style="margin-top:15px">ⓘ <span><b>Lưu ý:</b> Đây là báo cáo từ dữ liệu demo trên trình duyệt, không phải số liệu vận hành chính thức. Có thể xuất CSV để mở bằng Excel.</span></div>`;
  }
  function renderAccounts() {
    if(currentUser()?.role!=='admin') return '<div class="empty-state">Bạn không có quyền truy cập.</div>';
    return `${pageHeading('Tài khoản & nhật ký','Quản lý người dùng demo, vai trò và lịch sử thao tác.',`<button class="btn outline" data-action="backup-data">↓ Sao lưu dữ liệu</button><button class="btn outline" data-action="restore-data">↑ Khôi phục</button><button class="btn primary" data-action="open-account">＋ Tạo tài khoản</button>`)}
      <div class="notice-banner">⚠ <span><b>Phân quyền trong bản demo chỉ có tác dụng minh họa trên trình duyệt.</b> Không dùng bản này để bảo vệ dữ liệu thật. Khi triển khai chính thức, quyền phải được kiểm tra tại máy chủ.</span></div>
      <section class="panel table-panel" style="margin-bottom:15px"><div class="panel-head" style="padding:16px 17px 0"><div><div class="panel-title">Danh sách tài khoản</div><div class="panel-subtitle">${db.users.length} tài khoản đang được cấu hình</div></div></div><div class="table-wrap"><table><thead><tr><th>NGƯỜI DÙNG</th><th>TÊN ĐĂNG NHẬP</th><th>VAI TRÒ</th><th>PHÒNG ĐƯỢC GIAO</th><th>TRẠNG THÁI</th><th>THAO TÁC</th></tr></thead><tbody>${db.users.map(u=>`<tr><td><div class="account-card"><span class="account-avatar">${u.name.split(/\s+/).slice(-2).map(x=>x[0]).join('').toUpperCase()}</span><b>${esc(u.name)}</b></div></td><td>${esc(u.username)}</td><td><span class="role-chip">${roleName(u.role)}</span></td><td>${esc(roomById(u.assignedRoomId)?.code||'—')}</td><td>${u.active?'<span class="status-pill status-done">Đang hoạt động</span>':'<span class="status-pill status-neutral">Đã khóa</span>'}</td><td><div class="row-actions"><button class="row-action" data-action="edit-account" data-id="${u.id}" title="Sửa">✎</button><button class="row-action" data-action="toggle-account" data-id="${u.id}" title="Khóa / mở khóa">${u.active?'⊘':'✓'}</button></div></td></tr>`).join('')}</tbody></table></div></section>
      <section class="panel"><div class="panel-head"><div><div class="panel-title">Nhật ký thao tác</div><div class="panel-subtitle">Các thay đổi gần đây trong dữ liệu demo</div></div><button class="panel-action" data-action="clear-audit">Xóa nhật ký</button></div><div class="audit-list">${db.audit.slice(0,25).map(a=>`<div class="audit-line"><span>◷</span><span><b>${esc(a.user)}</b> · ${esc(a.action)}</span><time>${fmtDateTime(a.time)}</time></div>`).join('')||'<div class="empty-state">Chưa có nhật ký.</div>'}</div></section>`;
  }

  function modal(title,subtitle,body,footer='',wide=false) {
    document.getElementById('modal-root').innerHTML=`<div class="modal-backdrop" data-action="backdrop-close"><section class="modal ${wide?'wide':''}" role="dialog" aria-modal="true"><div class="modal-head"><div><h2>${title}</h2><p>${subtitle||''}</p></div><button class="modal-close" data-action="close-modal">×</button></div><div class="modal-body">${body}</div>${footer?`<div class="modal-foot">${footer}</div>`:''}</section></div>`;
  }
  function closeModal(){document.getElementById('modal-root').innerHTML='';}
  function formFooter(cancel='Đóng',save='Lưu thông tin'){return `<button class="btn outline" type="button" data-action="close-modal">${cancel}</button><button class="btn primary" type="submit">${save}</button>`;}
  function roomOptions(selected='') { return db.rooms.map(r=>`<option value="${r.id}" ${selected===r.id?'selected':''}>${esc(r.code)} · ${esc(r.name)}</option>`).join(''); }
  function computerOptions(selected='') { return db.computers.map(c=>`<option value="${c.id}" ${selected===c.id?'selected':''}>${esc(c.code)}</option>`).join(''); }
  function openRoomForm(roomId='') {
    if(!can('manageRooms',roomId||'')) { toast('Bạn không có quyền quản lý phòng này.','error');return; }
    const r=roomId?roomById(roomId):null;
    const body=`<form id="room-form" class="form-grid"><input type="hidden" name="id" value="${r?.id||''}"><label>Mã phòng *<input name="code" required value="${esc(r?.code||'')}" placeholder="Ví dụ: D2.506"></label><label>Tên phòng *<input name="name" required value="${esc(r?.name||'')}" placeholder="Phòng thực hành ..."></label><label>Vị trí *<input name="location" required value="${esc(r?.location||'')}" placeholder="Tầng, dãy nhà"></label><label>Sức chứa *<input type="number" min="1" name="capacity" required value="${r?.capacity||20}"></label><label>Người phụ trách *<input name="manager" required value="${esc(r?.manager||currentUser()?.name||'')}" placeholder="Họ và tên"></label><label>Tình trạng<select name="status">${ROOM_STATUSES.map(s=>`<option ${r?.status===s?'selected':''}>${s}</option>`).join('')}</select></label><label class="full-span">Mô tả<textarea name="description">${esc(r?.description||'')}</textarea></label></form>`;
    modal(r?'Cập nhật thông tin phòng':'Thêm phòng thực hành',r?'Điều chỉnh thông tin phòng trong hệ thống.':'Nhập thông tin cơ bản để khởi tạo phòng mới.',body,`<button class="btn outline" data-action="close-modal">Hủy</button><button class="btn primary" type="submit" form="room-form">${r?'Lưu thay đổi':'Tạo phòng'}</button>`);
  }
  function openComputerForm(computerId='',roomId='') {
    const existing=computerId?pcById(computerId):null, selectedRoom=existing?.roomId||roomId||currentUser()?.assignedRoomId||db.rooms[0]?.id;
    if(!can('manageComputers',existing?.roomId||selectedRoom)) { toast('Bạn không có quyền quản lý thiết bị trong phòng này.','error');return; }
    const c=existing;
    const body=`<form id="computer-form" class="form-grid"><input type="hidden" name="id" value="${c?.id||''}"><label>Mã máy *<input name="code" required value="${esc(c?.code||'')}" placeholder="D2.401-21"></label><label>Tên máy *<input name="name" required value="${esc(c?.name||'')}" placeholder="Máy tính ..."></label><label>Phòng *<select name="roomId" required>${roomOptions(selectedRoom)}</select></label><label>Vị trí trong phòng<input name="position" value="${esc(c?.position||'Dãy A · Vị trí 1')}"></label><label>CPU<input name="cpu" value="${esc(c?.cpu||'Intel Core i5')}"></label><label>RAM<input name="ram" value="${esc(c?.ram||'8 GB')}"></label><label>Ổ cứng<input name="storage" value="${esc(c?.storage||'SSD 256 GB')}"></label><label>Màn hình<input name="monitor" value="${esc(c?.monitor||'LCD 22 inch')}"></label><label>Hệ điều hành<input name="os" value="${esc(c?.os||'Windows 10 Pro 64-bit')}"></label><label>Ngày đưa vào sử dụng<input type="date" name="deployedDate" value="${c?.deployedDate||dateISO(0)}"></label><label>Tình trạng<select name="status">${COMPUTER_STATUSES.map(s=>`<option ${c?.status===s?'selected':''}>${s}</option>`).join('')}</select></label><label class="full-span">Ghi chú<textarea name="notes">${esc(c?.notes||'')}</textarea></label></form>`;
    modal(c?'Chỉnh sửa thiết bị':'Thêm máy tính mới', 'Thông tin máy tính và cấu hình kỹ thuật.',body,`<button class="btn outline" data-action="close-modal">Hủy</button><button class="btn primary" type="submit" form="computer-form">${c?'Lưu thay đổi':'Thêm thiết bị'}</button>`,true);
  }
  function viewComputer(computerId) {
    const c=pcById(computerId); if(!c){toast('Không tìm thấy thiết bị.','error');return;}
    const r=roomById(c.roomId), incidents=db.incidents.filter(i=>i.computerId===c.id), maintenance=db.maintenances.filter(m=>m.computerId===c.id);
    const history=[...incidents.map(i=>({date:i.reportDate,title:`Sự cố ${i.id}: ${i.description}`,status:i.status})),...maintenance.map(m=>({date:m.dueDate,title:`Bảo trì: ${m.title}`,status:m.status}))].sort((a,b)=>b.date.localeCompare(a.date));
    const canManage=can('manageComputers',c.roomId);
    const body=`<div class="detail-grid"><div class="detail-item"><span>MÃ MÁY</span><b>${esc(c.code)}</b></div><div class="detail-item"><span>TÌNH TRẠNG HIỆN TẠI</span><b>${statusPill(c.status)}</b></div><div class="detail-item"><span>TÊN MÁY</span><b>${esc(c.name)}</b></div><div class="detail-item"><span>PHÒNG</span><b>${esc(r?.code||'—')}</b></div><div class="detail-item"><span>VỊ TRÍ</span><b>${esc(c.position||'—')}</b></div><div class="detail-item"><span>CPU</span><b>${esc(c.cpu||'—')}</b></div><div class="detail-item"><span>RAM</span><b>${esc(c.ram||'—')}</b></div><div class="detail-item"><span>Ổ CỨNG</span><b>${esc(c.storage||'—')}</b></div><div class="detail-item"><span>MÀN HÌNH</span><b>${esc(c.monitor||'—')}</b></div><div class="detail-item"><span>HỆ ĐIỀU HÀNH</span><b>${esc(c.os||'—')}</b></div><div class="detail-item"><span>NGÀY ĐƯA VÀO SỬ DỤNG</span><b>${fmtDate(c.deployedDate)}</b></div><div class="detail-item"><span>PHỤ TRÁCH</span><b>${esc(r?.manager||'—')}</b></div></div><div class="detail-notes"><b>Ghi chú:</b> ${esc(c.notes||'Không có ghi chú.')}</div><div style="margin-top:17px"><b style="font-size:10px;color:var(--navy)">LỊCH SỬ SỰ CỐ / BẢO TRÌ</b>${history.length?history.slice(0,5).map(h=>`<div class="report-metric"><span>${fmtDate(h.date)} · ${esc(h.title)}</span><b>${esc(h.status)}</b></div>`).join(''):'<div class="muted" style="font-size:9px;margin-top:9px">Chưa có lịch sử.</div>'}</div>`;
    const actions=`<button class="btn outline" data-action="close-modal">Đóng</button><button class="btn outline" data-action="report-computer" data-id="${c.id}">⚑ Báo hỏng</button>${canManage?`<button class="btn light" data-action="quick-status" data-id="${c.id}">Đổi trạng thái</button><button class="btn secondary" data-action="edit-computer" data-id="${c.id}">Chỉnh sửa</button>`:''}${(can('manageMaintenance')||canManage)?`<button class="btn primary" data-action="quick-maintenance" data-id="${c.id}">Ghi nhận bảo trì</button>`:''}`;
    modal(`Chi tiết thiết bị · ${esc(c.code)}`,'Hồ sơ kỹ thuật và lịch sử xử lý của máy tính.',body,actions,true);
  }
  function openIncidentForm(computerId='') {
    const pc=computerId?pcById(computerId):null, roomId=pc?.roomId||currentUser()?.assignedRoomId||db.rooms[0]?.id;
    const body=`<form id="incident-form" class="form-grid"><label>Phòng *<select name="roomId" id="incident-room" required>${roomOptions(roomId)}</select></label><label>Máy gặp sự cố<select name="computerId" id="incident-computer"><option value="">Chưa xác định / lỗi chung phòng</option>${db.computers.filter(c=>!pc||c.roomId===roomId).map(c=>`<option value="${c.id}" ${pc?.id===c.id?'selected':''}>${esc(c.code)}</option>`).join('')}</select></label><label>Người báo lỗi *<input name="reporter" required value="${esc(currentUser()?.name||'')}" /></label><label>Mức độ ưu tiên<select name="priority"><option>Trung bình</option><option>Cao</option><option>Thấp</option></select></label><label class="full-span">Mô tả lỗi *<textarea name="description" required placeholder="Mô tả biểu hiện và thời điểm phát sinh..."></textarea></label><label>Người xử lý<input name="assignee" value="Trần Quốc Khánh" /></label><label>Ngày báo lỗi<input type="date" name="reportDate" value="${dateISO(0)}"></label></form>`;
    modal('Tạo phiếu báo sự cố','Ghi nhận thông tin để bộ phận kỹ thuật tiếp nhận.',body,`<button class="btn outline" data-action="close-modal">Hủy</button><button class="btn primary" type="submit" form="incident-form">Gửi phiếu</button>`);
  }
  function editIncident(incidentId) {
    const i=db.incidents.find(x=>x.id===incidentId); if(!i){toast('Không tìm thấy phiếu sự cố.','error');return;}
    if(!can('manageIncidents')){toast('Bạn không có quyền cập nhật phiếu sự cố.','error');return;}
    const body=`<form id="incident-edit-form" class="form-grid"><input type="hidden" name="id" value="${i.id}"><label>Mã sự cố<input value="${i.id}" disabled></label><label>Trạng thái<select name="status">${INCIDENT_STATUSES.map(s=>`<option ${i.status===s?'selected':''}>${s}</option>`).join('')}</select></label><label>Người xử lý<input name="assignee" value="${esc(i.assignee||'')}"></label><label>Ngày tiếp nhận<input type="date" name="receivedDate" value="${i.receivedDate||dateISO(0)}"></label><label>Ngày hoàn thành<input type="date" name="completedDate" value="${i.completedDate||''}"></label><label>Chi phí sửa chữa (đ)<input type="number" min="0" name="cost" value="${Number(i.cost||0)}"></label><label class="full-span">Kết quả xử lý<textarea name="result">${esc(i.result||'')}</textarea></label></form><div class="detail-notes">${esc(i.description)} · Người báo: ${esc(i.reporter)}</div>`;
    modal(`Cập nhật phiếu · ${i.id}`,'Cập nhật tiến độ và kết quả xử lý.',body,`<button class="btn outline" data-action="close-modal">Đóng</button><button class="btn primary" type="submit" form="incident-edit-form">Lưu cập nhật</button>`);
  }
  function openMaintenanceForm(computerId='') {
    if(!can('manageMaintenance')&&!can('manageComputers',pcById(computerId)?.roomId||'')){toast('Bạn không có quyền lập kế hoạch bảo trì.','error');return;}
    const pc=computerId?pcById(computerId):null, roomId=pc?.roomId||db.rooms[0]?.id;
    const body=`<form id="maintenance-form" class="form-grid"><label>Phòng *<select name="roomId" required>${roomOptions(roomId)}</select></label><label>Máy tính<select name="computerId"><option value="">Bảo trì toàn phòng</option>${db.computers.map(c=>`<option value="${c.id}" ${pc?.id===c.id?'selected':''}>${esc(c.code)}</option>`).join('')}</select></label><label class="full-span">Nội dung bảo trì *<input name="title" required placeholder="Vệ sinh máy, cập nhật phần mềm..."></label><label>Ngày dự kiến<input type="date" name="dueDate" required value="${dateISO(7)}"></label><label>Người thực hiện<input name="assignee" value="${esc(currentUser()?.name||'Trần Quốc Khánh')}"></label><label>Trạng thái<select name="status">${MAINTENANCE_STATUSES.filter(s=>s!=='Quá hạn').map(s=>`<option>${s}</option>`).join('')}</select></label><label>Chi phí dự kiến (đ)<input type="number" name="cost" min="0" value="0"></label><label class="full-span">Kết quả / ghi chú<textarea name="result"></textarea></label></form>`;
    modal('Tạo kế hoạch bảo trì','Lập lịch bảo dưỡng cho máy tính hoặc toàn bộ phòng.',body,`<button class="btn outline" data-action="close-modal">Hủy</button><button class="btn primary" type="submit" form="maintenance-form">Tạo kế hoạch</button>`);
  }
  function editMaintenance(id) {
    const m=db.maintenances.find(x=>x.id===id); if(!m)return;
    if(!can('manageMaintenance')&&!can('manageComputers',m.roomId)){toast('Bạn không có quyền cập nhật bảo trì.','error');return;}
    const body=`<form id="maintenance-edit-form" class="form-grid"><input type="hidden" name="id" value="${m.id}"><label>Mã kế hoạch<input value="${m.id}" disabled></label><label>Trạng thái<select name="status">${MAINTENANCE_STATUSES.map(s=>`<option ${m.status===s?'selected':''}>${s}</option>`).join('')}</select></label><label>Ngày dự kiến<input type="date" name="dueDate" value="${m.dueDate}"></label><label>Người thực hiện<input name="assignee" value="${esc(m.assignee||'')}"></label><label>Chi phí (đ)<input type="number" name="cost" min="0" value="${Number(m.cost||0)}"></label><label class="full-span">Nội dung bảo trì<input name="title" required value="${esc(m.title)}"></label><label class="full-span">Kết quả<textarea name="result">${esc(m.result||'')}</textarea></label></form>`;
    modal(`Cập nhật bảo trì · ${id}`,'Theo dõi tiến độ và kết quả thực hiện.',body,`<button class="btn outline" data-action="close-modal">Đóng</button><button class="btn primary" type="submit" form="maintenance-edit-form">Lưu cập nhật</button>`);
  }
  function openScheduleForm(id='') {
    if(!can('manageSchedules')){toast('Bạn không có quyền quản lý lịch phòng.','error');return;}
    const s=id?db.schedules.find(x=>x.id===id):null;
    const start=s?.start||dateTime(1,7,30),end=s?.end||dateTime(1,10,0);
    const body=`<form id="schedule-form" class="form-grid"><input type="hidden" name="id" value="${s?.id||''}"><label>Phòng *<select name="roomId" required>${roomOptions(s?.roomId||db.rooms[0]?.id)}</select></label><label>Lớp / nội dung *<input name="className" required value="${esc(s?.className||'')}" placeholder="Thực hành ..."></label><label>Giảng viên *<input name="teacher" required value="${esc(s?.teacher||currentUser()?.name||'')}"></label><label>Thời gian bắt đầu *<input type="datetime-local" name="start" required value="${start}"></label><label>Thời gian kết thúc *<input type="datetime-local" name="end" required value="${end}"></label><label class="full-span">Ghi chú<textarea name="notes">${esc(s?.notes||'')}</textarea></label></form><div class="field-hint" style="margin-top:10px">Hệ thống sẽ từ chối lịch bị trùng thời gian với lịch khác trong cùng phòng.</div>`;
    modal(s?'Chỉnh sửa lịch sử dụng':'Tạo lịch sử dụng phòng','Nhập thời gian và nội dung sử dụng phòng thực hành.',body,`<button class="btn outline" data-action="close-modal">Hủy</button><button class="btn primary" type="submit" form="schedule-form">${s?'Lưu thay đổi':'Tạo lịch'}</button>`);
  }
  function openAccountForm(id='') {
    const u=id?userById(id):null; if(currentUser()?.role!=='admin'){toast('Chỉ quản trị viên mới được quản lý tài khoản.','error');return;}
    const body=`<form id="account-form" class="form-grid"><input type="hidden" name="id" value="${u?.id||''}"><label>Họ và tên *<input name="name" required value="${esc(u?.name||'')}"></label><label>Tên đăng nhập *<input name="username" required value="${esc(u?.username||'')}"></label><label>Mật khẩu ${u?'(để trống nếu không đổi)':'*'}<input name="password" type="password" ${u?'':'required'} value=""></label><label>Vai trò *<select name="role">${Object.entries(ROLE_LABELS).map(([k,v])=>`<option value="${k}" ${u?.role===k?'selected':''}>${v}</option>`).join('')}</select></label><label>Phòng được giao<select name="assignedRoomId"><option value="">Không áp dụng</option>${roomOptions(u?.assignedRoomId||'')}</select></label><label>Trạng thái<select name="active"><option value="true" ${u?.active!==false?'selected':''}>Đang hoạt động</option><option value="false" ${u?.active===false?'selected':''}>Đã khóa</option></select></label></form>`;
    modal(u?'Chỉnh sửa tài khoản':'Tạo tài khoản mới','Thiết lập quyền sử dụng cho từng nhóm người dùng.',body,`<button class="btn outline" data-action="close-modal">Hủy</button><button class="btn primary" type="submit" form="account-form">Lưu tài khoản</button>`);
  }
  function confirmDialog(title,message,confirmAction,confirmText='Xác nhận') {
    modal(title,'Vui lòng kiểm tra trước khi tiếp tục.',`<p style="font-size:10px;line-height:1.8;color:#62768b">${message}</p>`,`<button class="btn outline" data-action="close-modal">Hủy</button><button class="btn danger" data-action="${confirmAction}" data-confirmed="true">${confirmText}</button>`);
  }

  function handleSubmit(form) {
    const fd=new FormData(form), v=Object.fromEntries(fd.entries());
    if(form.id==='room-form') {
      const old=v.id?roomById(v.id):null;
      if(!can('manageRooms',old?.id||'')){toast('Không có quyền thực hiện.','error');return;}
      if(db.rooms.some(r=>r.code.toLowerCase()===v.code.trim().toLowerCase()&&r.id!==v.id)){toast('Mã phòng đã tồn tại.','error');return;}
      const data={id:old?.id||uid('ROOM'),code:v.code.trim(),name:v.name.trim(),location:v.location.trim(),capacity:Number(v.capacity),manager:v.manager.trim(),status:v.status,description:v.description.trim()};
      if(!data.code||!data.name||!data.location||data.capacity<1){toast('Vui lòng kiểm tra dữ liệu bắt buộc.','error');return;}
      if(old) Object.assign(old,data); else db.rooms.push(data);
      closeModal();commit(old?'Đã cập nhật phòng thực hành.':'Đã thêm phòng thực hành.', 'success',old?'Cập nhật phòng '+data.code:'Tạo phòng '+data.code); return;
    }
    if(form.id==='computer-form') {
      const old=v.id?pcById(v.id):null;
      if(!can('manageComputers',old?.roomId||v.roomId)){toast('Không có quyền quản lý máy tại phòng này.','error');return;}
      if(!can('manageComputers',v.roomId)){toast('Bạn không có quyền chuyển máy vào phòng này.','error');return;}
      if(db.computers.some(c=>c.code.toLowerCase()===v.code.trim().toLowerCase()&&c.id!==v.id)){toast('Mã máy đã tồn tại.','error');return;}
      const data={id:old?.id||uid('PC'),code:v.code.trim(),name:v.name.trim(),roomId:v.roomId,position:v.position.trim(),cpu:v.cpu.trim(),ram:v.ram.trim(),storage:v.storage.trim(),monitor:v.monitor.trim(),os:v.os.trim(),deployedDate:v.deployedDate,status:v.status,notes:v.notes.trim()};
      if(old) { const moved=old.roomId!==data.roomId; Object.assign(old,data); if(moved){db.incidents.filter(i=>i.computerId===old.id).forEach(i=>i.roomId=data.roomId);db.maintenances.filter(m=>m.computerId===old.id).forEach(m=>m.roomId=data.roomId);} } else db.computers.push(data);
      closeModal();commit(old?'Đã cập nhật thiết bị.':'Đã thêm thiết bị mới.','success',old?'Cập nhật máy '+data.code:'Thêm máy '+data.code); return;
    }
    if(form.id==='incident-form') {
      if(!can('reportIncident')){toast('Bạn không có quyền gửi phiếu báo hỏng.','error');return;}
      const room=roomById(v.roomId),pc=v.computerId?pcById(v.computerId):null;
      if(!room||!v.description.trim()||!v.reporter.trim()||(pc&&pc.roomId!==v.roomId)){toast('Vui lòng kiểm tra phòng, máy và mô tả lỗi.','error');return;}
      const code=`SC-${(v.reportDate||dateISO(0)).replaceAll('-','')}-${String(db.incidents.length+1).padStart(3,'0')}`;
      db.incidents.unshift({id:code,roomId:v.roomId,computerId:v.computerId,reporter:v.reporter.trim(),description:v.description.trim(),priority:v.priority,assignee:v.assignee.trim(),reportDate:v.reportDate||dateISO(0),receivedDate:'',completedDate:'',cost:0,status:'Mới tiếp nhận',result:''});
      if(pc && ['Hoạt động tốt','Đang sử dụng'].includes(pc.status)) pc.status='Bị hỏng';
      closeModal();commit('Đã gửi phiếu báo sự cố '+code+'.','success','Tạo phiếu sự cố '+code);return;
    }
    if(form.id==='incident-edit-form') {
      if(!can('manageIncidents')){toast('Bạn không có quyền cập nhật sự cố.','error');return;}
      const i=db.incidents.find(x=>x.id===v.id);if(!i)return;
      Object.assign(i,{status:v.status,assignee:v.assignee.trim(),receivedDate:v.receivedDate,completedDate:v.completedDate,cost:Number(v.cost||0),result:v.result.trim()});
      if(v.status==='Đã hoàn thành'||v.status==='Không thể sửa chữa') { if(!i.completedDate)i.completedDate=dateISO(0); }
      if(i.computerId){const pc=pcById(i.computerId);if(pc){if(v.status==='Đang xử lý'||v.status==='Chờ linh kiện')pc.status='Đang sửa chữa';if(v.status==='Đã hoàn thành')pc.status='Hoạt động tốt';if(v.status==='Không thể sửa chữa')pc.status='Ngừng sử dụng';}}
      closeModal();commit('Đã cập nhật tiến độ sự cố.','success','Cập nhật sự cố '+i.id+' → '+i.status);return;
    }
    if(form.id==='maintenance-form') {
      if(!can('manageMaintenance')&&!can('manageComputers',roomById(v.roomId)?.id||'')){toast('Không có quyền tạo kế hoạch bảo trì.','error');return;}
      if(!v.title.trim()||!v.dueDate||!roomById(v.roomId)){toast('Vui lòng nhập đầy đủ nội dung bảo trì.','error');return;}
      const id=`BT-${(v.dueDate||dateISO(0)).slice(0,7).replace('-','')}-${String(db.maintenances.length+1).padStart(3,'0')}`;
      db.maintenances.unshift({id,roomId:v.roomId,computerId:v.computerId,title:v.title.trim(),dueDate:v.dueDate,assignee:v.assignee.trim(),status:v.status,result:v.result.trim(),cost:Number(v.cost||0)});
      if(v.computerId){const pc=pcById(v.computerId);if(pc&&v.status==='Đang thực hiện')pc.status='Đang bảo trì';}
      closeModal();commit('Đã tạo kế hoạch bảo trì '+id+'.','success','Tạo kế hoạch bảo trì '+id);return;
    }
    if(form.id==='maintenance-edit-form') {
      const m=db.maintenances.find(x=>x.id===v.id);if(!m)return;
      if(!can('manageMaintenance')&&!can('manageComputers',m.roomId)){toast('Không có quyền cập nhật bảo trì.','error');return;}
      Object.assign(m,{status:v.status,dueDate:v.dueDate,assignee:v.assignee.trim(),cost:Number(v.cost||0),title:v.title.trim(),result:v.result.trim()});
      if(m.computerId){const pc=pcById(m.computerId);if(pc){if(v.status==='Đang thực hiện')pc.status='Đang bảo trì';if(v.status==='Đã hoàn thành'&&pc.status==='Đang bảo trì')pc.status='Hoạt động tốt';}}
      closeModal();commit('Đã cập nhật kế hoạch bảo trì.','success','Cập nhật bảo trì '+m.id);return;
    }
    if(form.id==='schedule-form') {
      if(!can('manageSchedules')){toast('Bạn không có quyền quản lý lịch phòng.','error');return;}
      const start=new Date(v.start),end=new Date(v.end);if(!roomById(v.roomId)||!v.className.trim()||!v.teacher.trim()||isNaN(start)||isNaN(end)||start>=end){toast('Dữ liệu lịch không hợp lệ. Kiểm tra thời gian bắt đầu và kết thúc.','error');return;}
      const duplicate=db.schedules.find(x=>x.id!==v.id&&x.roomId===v.roomId&&start<new Date(x.end)&&end>new Date(x.start));
      if(duplicate){toast(`Lịch bị trùng với ${duplicate.className} (${fmtDateTime(duplicate.start)}).`,'error');return;}
      const s={id:v.id||uid('LS'),roomId:v.roomId,className:v.className.trim(),teacher:v.teacher.trim(),start:v.start,end:v.end,notes:v.notes.trim()};
      const old=db.schedules.find(x=>x.id===v.id);if(old)Object.assign(old,s);else db.schedules.push(s);
      closeModal();commit(old?'Đã cập nhật lịch sử dụng.':'Đã tạo lịch sử dụng phòng.','success',old?'Cập nhật lịch '+s.id:'Tạo lịch '+s.id);return;
    }
    if(form.id==='account-form') {
      if(currentUser()?.role!=='admin'){toast('Chỉ quản trị viên được quản lý tài khoản.','error');return;}
      if(db.users.some(u=>u.username.toLowerCase()===v.username.trim().toLowerCase()&&u.id!==v.id)){toast('Tên đăng nhập đã được sử dụng.','error');return;}
      const old=v.id?userById(v.id):null;if(!old&&!v.password){toast('Vui lòng đặt mật khẩu cho tài khoản mới.','error');return;}
      const data={id:old?.id||uid('USER'),name:v.name.trim(),username:v.username.trim(),password:v.password||old?.password,role:v.role,assignedRoomId:v.assignedRoomId,active:v.active==='true'};
      if(old)Object.assign(old,data);else db.users.push(data);
      closeModal();commit(old?'Đã cập nhật tài khoản.':'Đã tạo tài khoản mới.','success',old?'Cập nhật tài khoản '+data.username:'Tạo tài khoản '+data.username);return;
    }
  }

  function deleteComputer(id) {
    const c=pcById(id);if(!c)return;if(!can('manageComputers',c.roomId)){toast('Bạn không có quyền xóa máy này.','error');return;}
    if(db.incidents.some(i=>i.computerId===id)||db.maintenances.some(m=>m.computerId===id)){toast('Máy còn lịch sử sự cố hoặc bảo trì, không thể xóa.','error');return;}
    confirmDialog('Xóa thiết bị',`Bạn có chắc muốn xóa thiết bị <b>${esc(c.code)}</b>? Thao tác này không thể hoàn tác.`, 'confirm-delete-computer','Xóa thiết bị');
    document.querySelector('[data-action="confirm-delete-computer"]')?.setAttribute('data-id',id);
  }
  function deleteRoom(id) {
    const r=roomById(id);if(!r)return;if(!can('manageRooms',id)){toast('Bạn không có quyền xóa phòng này.','error');return;}
    if(roomPCs(id).length||db.schedules.some(s=>s.roomId===id)||db.incidents.some(i=>i.roomId===id)||db.maintenances.some(m=>m.roomId===id)){toast('Phòng còn thiết bị hoặc lịch sử ràng buộc nên không thể xóa.','error');return;}
    confirmDialog('Xóa phòng thực hành',`Xóa phòng <b>${esc(r.code)}</b> khỏi danh sách?`,'confirm-delete-room','Xóa phòng');document.querySelector('[data-action="confirm-delete-room"]')?.setAttribute('data-id',id);
  }
  function exportCSV() {
    const header=['MaMay','TenMay','MaPhong','ViTri','CPU','RAM','O cung','Man hinh','He dieu hanh','Ngay su dung','Tinh trang','Ghi chu'];
    const rows=db.computers.map(c=>[c.code,c.name,roomById(c.roomId)?.code||'',c.position,c.cpu,c.ram,c.storage,c.monitor,c.os,c.deployedDate,c.status,c.notes]);
    downloadText([header,...rows].map(row=>row.map(csvCell).join(',')).join('\r\n'),'hueic-thiet-bi.csv','text/csv;charset=utf-8');toast('Đã xuất danh sách thiết bị CSV.');
  }
  function exportReport() {
    const header=['MaPhong','MaMay','TinhTrang','CPU','RAM','O_cung','Ngay_su_dung'];
    const rows=db.computers.filter(c=>(reportFilters.room==='all'||c.roomId===reportFilters.room)&&(reportFilters.status==='all'||c.status===reportFilters.status)).map(c=>[roomById(c.roomId)?.code||'',c.code,c.status,c.cpu,c.ram,c.storage,c.deployedDate]);
    downloadText([header,...rows].map(row=>row.map(csvCell).join(',')).join('\r\n'),'hueic-bao-cao-thiet-bi.csv','text/csv;charset=utf-8');toast('Đã xuất báo cáo CSV.');
  }
  function csvCell(value) { const s=String(value??'');return /[",\r\n]/.test(s)?`"${s.replace(/"/g,'""')}"`:s; }
  function downloadText(text,filename,type) { const blob=new Blob(['\ufeff',text],{type}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=filename;a.click();URL.revokeObjectURL(url); }
  function parseCSV(text) {
    const lines=text.replace(/^\uFEFF/,'').split(/\r?\n/).filter(x=>x.trim());if(lines.length<2)throw new Error('Tệp CSV không có dữ liệu.');
    const parseLine=line=>{const out=[];let value='',quoted=false;for(let i=0;i<line.length;i++){const c=line[i];if(c==='"'&&quoted&&line[i+1]==='"'){value+='"';i++;}else if(c==='"'){quoted=!quoted;}else if(c===','&&!quoted){out.push(value);value='';}else value+=c;}out.push(value);return out;};
    const headers=parseLine(lines[0]).map(x=>x.trim());return lines.slice(1).map(line=>{const cols=parseLine(line),o={};headers.forEach((h,i)=>o[h]=cols[i]??'');return o;});
  }
  function backupData() { const blob=new Blob([JSON.stringify(db,null,2)],{type:'application/json'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=`hueic-backup-${dateISO(0)}.json`;a.click();URL.revokeObjectURL(url);toast('Đã tạo tệp sao lưu JSON.');addAudit('Sao lưu dữ liệu JSON');saveDatabase(); }
  function importBackup(file) {
    const reader=new FileReader();reader.onload=()=>{try{const parsed=JSON.parse(reader.result);if(!parsed||!Array.isArray(parsed.rooms)||!Array.isArray(parsed.computers)||!Array.isArray(parsed.users)||!Array.isArray(parsed.incidents)||!Array.isArray(parsed.maintenances)||!Array.isArray(parsed.schedules))throw new Error('Thiếu dữ liệu cần thiết.');db=parsed;saveDatabase();addAudit('Khôi phục dữ liệu từ tệp JSON');saveDatabase();closeModal();showApp();toast('Đã khôi phục dữ liệu thành công.');}catch(e){toast('Tệp sao lưu không hợp lệ: '+e.message,'error');}};reader.onerror=()=>toast('Không thể đọc tệp sao lưu.','error');reader.readAsText(file); }
  function importCSV(file) {
    const reader=new FileReader();reader.onload=()=>{try{const rows=parseCSV(reader.result);let added=0,updated=0,skipped=0;
      rows.forEach(row=>{const code=row.MaMay||row.maMay||row['Mã máy']||row.code||'';const roomCode=row.MaPhong||row.maPhong||row['Phòng']||'';const room=db.rooms.find(r=>r.code.toLowerCase()===roomCode.trim().toLowerCase());if(!code||!room){skipped++;return;}const old=db.computers.find(c=>c.code.toLowerCase()===code.trim().toLowerCase());if(!can('manageComputers',room.id)){skipped++;return;}const c={id:old?.id||uid('PC'),code:code.trim(),name:row.TenMay||row['Tên máy']||`Máy tính ${code}`,roomId:room.id,position:row.ViTri||'Chưa xác định',cpu:row.CPU||'Intel Core i5',ram:row.RAM||'8 GB',storage:row['O cung']||row['Ổ cứng']||'SSD 256 GB',monitor:row['Man hinh']||'LCD 22 inch',os:row['He dieu hanh']||'Windows 10 Pro 64-bit',deployedDate:row['Ngay su dung']||dateISO(0),status:COMPUTER_STATUSES.includes(row['Tinh trang'])?row['Tinh trang']:'Hoạt động tốt',notes:row['Ghi chu']||''};if(old){Object.assign(old,c);updated++;}else{db.computers.push(c);added++;}});
      closeModal();commit(`Nhập CSV hoàn tất: thêm ${added}, cập nhật ${updated}, bỏ qua ${skipped} dòng.`,'success','Nhập danh sách thiết bị CSV');}catch(e){toast('Không thể nhập CSV: '+e.message,'error');}};reader.onerror=()=>toast('Không đọc được tệp CSV.','error');reader.readAsText(file,'UTF-8');
  }

  document.addEventListener('click',event=>{
    const nav=event.target.closest('[data-page]');if(nav){navigate(nav.dataset.page);return;}
    const navJump=event.target.closest('[data-nav]');if(navJump){navigate(navJump.dataset.nav);return;}
    const btn=event.target.closest('[data-action]');if(!btn)return;
    const {action,id,roomId}=btn.dataset;
    switch(action){
      case 'close-modal': closeModal();break;
      case 'backdrop-close': if(event.target===btn)closeModal();break;
      case 'open-room-form':openRoomForm();break;
      case 'edit-room':openRoomForm(id);break;
      case 'open-room':selectedRoomId=id;renderPage();break;
      case 'back-rooms':selectedRoomId='';renderPage();break;
      case 'delete-room':deleteRoom(id);break;
      case 'open-computer-form':openComputerForm('',roomId||'');break;
      case 'edit-computer':closeModal();openComputerForm(id);break;
      case 'view-computer':viewComputer(id);break;
      case 'delete-computer':deleteComputer(id);break;
      case 'open-incident':openIncidentForm();break;
      case 'report-computer':closeModal();openIncidentForm(id);break;
      case 'edit-incident':editIncident(id);break;
      case 'open-maintenance':openMaintenanceForm();break;
      case 'quick-maintenance':closeModal();openMaintenanceForm(id);break;
      case 'edit-maintenance':editMaintenance(id);break;
      case 'open-schedule':openScheduleForm();break;
      case 'edit-schedule':openScheduleForm(id);break;
      case 'delete-schedule':confirmDialog('Xóa lịch sử dụng','Bạn chắc chắn muốn xóa lịch sử dụng phòng này?','confirm-delete-schedule','Xóa lịch');document.querySelector('[data-action="confirm-delete-schedule"]')?.setAttribute('data-id',id);break;
      case 'open-account':openAccountForm();break;
      case 'edit-account':openAccountForm(id);break;
      case 'toggle-account':{const u=userById(id);if(u&&u.id!==currentUserId){u.active=!u.active;commit(u.active?'Đã mở khóa tài khoản.':'Đã khóa tài khoản.','success','Đổi trạng thái tài khoản '+u.username);}else toast('Không thể khóa tài khoản đang đăng nhập.','error');break;}
      case 'confirm-delete-computer':{const c=pcById(id);db.computers=db.computers.filter(x=>x.id!==id);closeModal();commit('Đã xóa thiết bị.','success','Xóa máy '+(c?.code||id));break;}
      case 'confirm-delete-room':{const r=roomById(id);db.rooms=db.rooms.filter(x=>x.id!==id);closeModal();selectedRoomId='';commit('Đã xóa phòng.','success','Xóa phòng '+(r?.code||id));break;}
      case 'confirm-delete-schedule':db.schedules=db.schedules.filter(x=>x.id!==id);closeModal();commit('Đã xóa lịch sử dụng.','success','Xóa lịch '+id);break;
      case 'quick-status':{const c=pcById(id);if(!c)return;if(!can('manageComputers',c.roomId)){toast('Không có quyền thay đổi trạng thái máy.','error');return;}const body=`<form id="status-form"><label class="form-grid">Trạng thái mới<select name="status">${COMPUTER_STATUSES.map(s=>`<option ${c.status===s?'selected':''}>${s}</option>`).join('')}</select></label><input type="hidden" name="id" value="${id}"></form>`;modal('Chuyển trạng thái thiết bị',c.code,body,`<button class="btn outline" data-action="close-modal">Hủy</button><button class="btn primary" type="submit" form="status-form">Cập nhật</button>`);break;}
      case 'refresh-data':renderPage();toast('Dữ liệu đã được làm mới.');break;
      case 'export-csv':exportCSV();break;
      case 'export-report':exportReport();break;
      case 'print-report':window.print();break;
      case 'import-csv':document.getElementById('csv-import-input').click();break;
      case 'backup-data':backupData();break;
      case 'restore-data':document.getElementById('backup-import-input').click();break;
      case 'clear-audit':confirmDialog('Xóa nhật ký thao tác','Bạn có chắc muốn xóa toàn bộ nhật ký đang lưu?','confirm-clear-audit','Xóa nhật ký');break;
      case 'confirm-clear-audit':db.audit=[];closeModal();commit('Đã xóa nhật ký thao tác.','success','Xóa nhật ký');break;
      case 'switch-account':openSwitchAccount();break;
    }
  });
  document.addEventListener('submit',event=>{const form=event.target;if(!form.id)return;event.preventDefault();if(form.id==='login-form'){const ok=login(document.getElementById('login-username').value.trim(),document.getElementById('login-password').value);document.getElementById('login-error').textContent=ok?'':'Tên đăng nhập hoặc mật khẩu không chính xác.';return;}if(form.id==='status-form'){const fd=new FormData(form),v=Object.fromEntries(fd.entries()),c=pcById(v.id);if(c&&can('manageComputers',c.roomId)){c.status=v.status;closeModal();commit('Đã chuyển trạng thái thiết bị.','success','Đổi trạng thái '+c.code+' → '+v.status);}return;}handleSubmit(form);});
  document.getElementById('main-nav').addEventListener('click',()=>{});
  document.getElementById('profile-button').addEventListener('click',()=>document.getElementById('profile-menu').classList.toggle('hidden'));
  document.getElementById('logout-button').addEventListener('click',()=>{currentUserId='';localStorage.removeItem('hueic_current_user');document.getElementById('profile-menu').classList.add('hidden');showLogin();});
  document.getElementById('switch-account').addEventListener('click',openSwitchAccount);
  document.getElementById('menu-toggle').addEventListener('click',()=>document.getElementById('sidebar').classList.add('open'));
  document.getElementById('sidebar-close').addEventListener('click',()=>document.getElementById('sidebar').classList.remove('open'));
  document.getElementById('notification-btn').addEventListener('click',()=>{const pending=db.incidents.filter(i=>!['Đã hoàn thành','Không thể sửa chữa'].includes(i.status)).length;toast(`Hiện có ${pending} sự cố chưa hoàn tất và ${db.maintenances.filter(m=>m.status!=='Đã hoàn thành'&&m.dueDate<=dateISO(7)).length} kế hoạch bảo trì đến hạn.`);});
  document.getElementById('csv-import-input').addEventListener('change',e=>{const f=e.target.files[0];if(f)importCSV(f);e.target.value='';});
  document.getElementById('backup-import-input').addEventListener('change',e=>{const f=e.target.files[0];if(f)importBackup(f);e.target.value='';});
  document.querySelectorAll('[data-demo-login]').forEach(btn=>btn.addEventListener('click',()=>{const names={admin:'admin',manager:'manager',technician:'technician',lecturer_in_charge:'gvphutrach',lecturer:'lecturer'};document.getElementById('login-username').value=names[btn.dataset.demoLogin];document.getElementById('login-password').value='hueic123';}));

  function openSwitchAccount() {
    const choices=db.users.filter(u=>u.active).map(u=>`<button class="quick-action" style="width:100%;margin-bottom:8px" data-action="choose-account" data-id="${u.id}"><span class="quick-icon">♙</span><span><b>${esc(u.name)}</b><small>${roleName(u.role)} · ${esc(u.username)}</small></span></button>`).join('');
    modal('Đổi tài khoản demo','Chọn vai trò để kiểm tra giao diện và quyền thao tác.',choices,'<button class="btn outline" data-action="close-modal">Đóng</button>');
  }
  document.addEventListener('click',event=>{const b=event.target.closest('[data-action="choose-account"]');if(b){currentUserId=b.dataset.id;localStorage.setItem('hueic_current_user',currentUserId);closeModal();currentPage='dashboard';selectedRoomId='';showApp();toast('Đã chuyển tài khoản demo.');}});
  document.addEventListener('submit',event=>{if(event.target.id==='status-form')return;});

  window.__filterRooms=value=>{const root=document.getElementById('room-grid');if(!root)return;const v=value.toLowerCase();root.innerHTML=renderRoomCards(db.rooms.filter(r=>`${r.code} ${r.name} ${r.manager}`.toLowerCase().includes(v)));};
  window.__filterDevices=(key,value)=>{deviceFilters[key]=value;renderPage();const search=document.querySelector('.toolbar-search input');if(key==='search'&&search){search.focus();search.setSelectionRange(value.length,value.length);}};
  window.__filterIncidents=(key,value)=>{incidentFilters[key]=value;renderPage();const search=document.querySelector('.toolbar-search input');if(key==='search'&&search){search.focus();search.setSelectionRange(value.length,value.length);}};
  window.__filterMaintenance=value=>{maintenanceFilters.status=value;renderPage();};
  window.__filterReport=(key,value)=>{reportFilters[key]=value;if(['from','to'].includes(key)&&reportFilters.from>reportFilters.to){toast('Ngày bắt đầu không được sau ngày kết thúc.','error');reportFilters[key]=key==='from'?reportFilters.to:reportFilters.from;}renderPage();};
  window.__filterDashboard=(key,value)=>{dashboardFilters[key]=value;if(dashboardFilters.from>dashboardFilters.to){toast('Ngày bắt đầu không được sau ngày kết thúc.','error');dashboardFilters[key]=key==='from'?dashboardFilters.to:dashboardFilters.from;}renderPage();};

  // Account quick-select in modal uses a delegated handler above.
  if(currentUser() && currentUser().active) showApp(); else showLogin();
})();

import { useState, useEffect } from 'react';
import api from '../api';
import { Bell, Send, Trash2, Loader2, X, Users, MessageSquare, Mail, Phone, Eye, Plus, BookTemplate, Edit, Check, AlertTriangle } from 'lucide-react';

const VARS = ['{{nama}}','{{paket}}','{{nominal}}','{{jatuh_tempo}}'];

const substituteVars = (text, customer) => {
    if (!text) return '';
    return text
        .replace(/\{\{nama\}\}/g, customer?.name || 'Pelanggan')
        .replace(/\{\{paket\}\}/g, customer?.package_name || '10 Mbps')
        .replace(/\{\{nominal\}\}/g, 'Rp 150.000')
        .replace(/\{\{jatuh_tempo\}\}/g, '5 Mei 2026');
};

const channelOpts = [
    { val: 'wa',    icon: Phone, label: 'WhatsApp', color: 'bg-green-500' },
    { val: 'email', icon: Mail,  label: 'Email',    color: 'bg-blue-500' },
    { val: 'both',  icon: Send,  label: 'Keduanya', color: 'bg-purple-500' },
];

const WaPreview = ({ title, message, customer }) => (
    <div className="bg-[#e5ddd5] rounded-xl p-4 min-h-48">
        <div className="bg-[#075e54] text-white px-4 py-2 rounded-t-xl text-sm font-bold mb-3 flex items-center gap-2">
            <div className="w-7 h-7 bg-white/30 rounded-full flex items-center justify-center font-bold text-xs">{customer?.name?.charAt(0)||'P'}</div>
            {customer?.name || 'Pelanggan'}
        </div>
        <div className="flex justify-end">
            <div className="bg-[#dcf8c6] rounded-xl rounded-tr-none px-4 py-3 max-w-xs shadow-sm">
                {title && <p className="font-bold text-gray-800 text-sm mb-1">{substituteVars(title, customer)}</p>}
                <p className="text-gray-700 text-sm whitespace-pre-wrap">{substituteVars(message, customer) || <span className="italic text-gray-400">Pesan akan muncul di sini...</span>}</p>
                <p className="text-right text-[10px] text-gray-400 mt-1">19:30 ✓✓</p>
            </div>
        </div>
    </div>
);

const EmailPreview = ({ title, message, customer }) => (
    <div className="bg-gray-100 rounded-xl p-4">
        <div className="bg-white rounded-xl overflow-hidden shadow">
            <div className="bg-blue-600 px-6 py-4">
                <p className="text-white font-black text-lg">NetBilling ISP</p>
                <p className="text-blue-200 text-xs">Layanan Internet Terpercaya</p>
            </div>
            <div className="px-6 py-5">
                <p className="text-xs text-gray-400 mb-1">Kepada: {customer?.email || customer?.name || 'pelanggan@email.com'}</p>
                <h2 className="font-black text-gray-800 text-base mb-3 border-b pb-2">{substituteVars(title, customer) || <span className="italic text-gray-400">Subjek email...</span>}</h2>
                <p className="text-sm text-gray-600 whitespace-pre-wrap leading-relaxed">{substituteVars(message, customer) || <span className="italic text-gray-400">Isi pesan akan muncul di sini...</span>}</p>
            </div>
            <div className="bg-gray-50 px-6 py-3 text-center text-xs text-gray-400 border-t">
                NetBilling ISP &bull; Jl. Contoh No. 1 &bull; Jangan balas email ini
            </div>
        </div>
    </div>
);

export default function Notifications() {
    const [notifs, setNotifs]     = useState([]);
    const [templates, setTemplates] = useState([]);
    const [customers, setCustomers] = useState([]);
    const [loading, setLoading]   = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [showTplModal, setShowTplModal] = useState(false);
    const [editTpl, setEditTpl]   = useState(null);
    const [previewTab, setPreviewTab] = useState('wa');
    const [sending, setSending]   = useState(false);
    const [toast, setToast]       = useState(null);
    const [form, setForm] = useState({ title:'', message:'', type:'broadcast', channel:'wa', customer_id:'' });
    const [tplForm, setTplForm]   = useState({ name:'', title:'', message:'' });

    const showToast = (msg, type='success') => { setToast({msg,type}); setTimeout(()=>setToast(null),4000); };

    const fetchAll = async () => {
        try {
            setLoading(true);
            const [n, t, c] = await Promise.all([api.get('/notifications'), api.get('/notification-templates'), api.get('/customers')]);
            setNotifs(n.data); setTemplates(t.data); setCustomers(c.data);
        } catch(e){ console.error(e); } finally { setLoading(false); }
    };
    useEffect(()=>{ fetchAll(); },[]);

    const selectedCustomer = form.type === 'personal' ? customers.find(c=>c.id===parseInt(form.customer_id)) : customers[0];

    const insertVar = (v) => setForm(f=>({...f, message: f.message + v}));

    const applyTemplate = (t) => setForm(f=>({...f, title:t.title, message:t.message}));

    const handleSend = async(e) => {
        e.preventDefault();
        if(form.type==='personal' && !form.customer_id){ showToast('Pilih pelanggan terlebih dahulu','error'); return; }
        try {
            setSending(true);
            const res = await api.post('/notifications', form);
            showToast('✅ '+res.data.message);
            setShowModal(false);
            setForm({title:'',message:'',type:'broadcast',channel:'wa',customer_id:''});
            fetchAll();
        } catch(err){
            const e = err.response?.data;
            showToast('❌ '+(e?.errors ? Object.values(e.errors)[0][0] : e?.message||'Gagal kirim'),'error');
        } finally { setSending(false); }
    };

    const handleDelete = async(id) => {
        if(!window.confirm('Hapus log ini?')) return;
        await api.delete(`/notifications/${id}`); fetchAll();
    };

    const handleSaveTpl = async(e) => {
        e.preventDefault();
        try {
            if(editTpl) { await api.put(`/notification-templates/${editTpl.id}`, tplForm); showToast('✅ Template diperbarui'); }
            else { await api.post('/notification-templates', tplForm); showToast('✅ Template disimpan'); }
            setShowTplModal(false); setEditTpl(null); setTplForm({name:'',title:'',message:''});
            fetchAll();
        } catch(err){ showToast('❌ Gagal simpan template','error'); }
    };

    const handleDeleteTpl = async(t) => {
        if(t.is_default){ showToast('❌ Template bawaan tidak dapat dihapus','error'); return; }
        if(!window.confirm(`Hapus template "${t.name}"?`)) return;
        await api.delete(`/notification-templates/${t.id}`); fetchAll();
    };

    const openEditTpl = (t) => { setEditTpl(t); setTplForm({name:t.name,title:t.title,message:t.message}); setShowTplModal(true); };

    const channelLabel = { wa:'WhatsApp', email:'Email', both:'WA & Email' };

    return (
        <div className="p-8">
            {toast && (
                <div className="fixed top-5 left-1/2 -translate-x-1/2 z-[10000]">
                    <div className={`px-6 py-3 rounded-full shadow-2xl flex items-center gap-3 border text-white ${toast.type==='error'?'bg-red-600 border-red-500':'bg-gray-900 border-gray-700'}`}>
                        {toast.type==='error'?<AlertTriangle className="w-4 h-4"/>:<Check className="w-4 h-4 text-green-400"/>}
                        <span className="font-bold text-sm">{toast.msg}</span>
                    </div>
                </div>
            )}

            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-3xl font-black text-gray-800">Notifikasi & Broadcast</h1>
                    <p className="text-gray-500 mt-1">Kirim pesan ke pelanggan via WhatsApp atau Email.</p>
                </div>
                <div className="flex gap-3">
                    <button onClick={()=>{setEditTpl(null);setTplForm({name:'',title:'',message:''});setShowTplModal(true);}} className="flex items-center gap-2 border border-gray-300 text-gray-700 px-4 py-2.5 rounded-xl font-bold hover:bg-gray-50 transition">
                        <Plus className="w-4 h-4"/> Template Baru
                    </button>
                    <button onClick={()=>setShowModal(true)} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-bold shadow-lg shadow-blue-500/30 transition hover:-translate-y-0.5">
                        <Send className="w-4 h-4"/> Kirim Notifikasi
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-3 gap-4 mb-8">
                {[
                    {label:'Total Terkirim', val:notifs.length, icon:MessageSquare, color:'bg-blue-50 border-blue-100 text-blue-600'},
                    {label:'Total Penerima', val:notifs.reduce((a,n)=>a+(n.recipient_count||0),0), icon:Users, color:'bg-green-50 border-green-100 text-green-600'},
                    {label:'Template Tersimpan', val:templates.length, icon:Bell, color:'bg-purple-50 border-purple-100 text-purple-600'},
                ].map(({label,val,icon:Icon,color})=>(
                    <div key={label} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex items-center gap-4">
                        <div className={`p-3 rounded-xl border ${color}`}><Icon className="w-5 h-5"/></div>
                        <div><p className="text-xs font-bold text-gray-400 uppercase tracking-wider">{label}</p><p className="text-2xl font-black text-gray-800">{val}</p></div>
                    </div>
                ))}
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="p-5 border-b border-gray-100 flex items-center gap-2">
                    <Bell className="w-5 h-5 text-blue-600"/>
                    <h2 className="font-black text-gray-800">Log Notifikasi Terkirim</h2>
                </div>
                {loading ? <div className="py-16 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-blue-500"/></div>
                : notifs.length===0 ? <div className="py-16 text-center text-gray-400 italic">Belum ada notifikasi.</div>
                : <div className="divide-y divide-gray-50">
                    {notifs.map(n=>(
                        <div key={n.id} className="p-5 hover:bg-blue-50/20 transition flex items-start justify-between gap-4">
                            <div className="flex items-start gap-4">
                                <div className={`mt-0.5 p-2 rounded-xl ${n.type==='broadcast'?'bg-blue-50 text-blue-600':'bg-purple-50 text-purple-600'}`}>
                                    {n.type==='broadcast'?<Users className="w-4 h-4"/>:<Bell className="w-4 h-4"/>}
                                </div>
                                <div>
                                    <p className="font-bold text-gray-800">{n.title}</p>
                                    <p className="text-sm text-gray-500 mt-0.5 line-clamp-2">{n.message}</p>
                                    <div className="flex items-center gap-2 mt-2 flex-wrap">
                                        <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${n.type==='broadcast'?'bg-blue-100 text-blue-700':'bg-purple-100 text-purple-700'}`}>{n.type==='broadcast'?'Broadcast':'Personal'}</span>
                                        <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${n.channel==='wa'?'bg-green-100 text-green-700':n.channel==='email'?'bg-blue-100 text-blue-700':'bg-indigo-100 text-indigo-700'}`}>{channelLabel[n.channel]||n.channel}</span>
                                        <span className="text-xs text-gray-400">{n.recipient_count} penerima</span>
                                        <span className="text-xs text-gray-400">• {n.sender?.name||'System'}</span>
                                        <span className="text-xs text-gray-400">• {new Date(n.created_at).toLocaleString('id-ID',{dateStyle:'medium',timeStyle:'short'})}</span>
                                    </div>
                                </div>
                            </div>
                            <button onClick={()=>handleDelete(n.id)} className="flex-shrink-0 p-2 bg-red-50 text-red-400 hover:bg-red-100 rounded-lg transition"><Trash2 className="w-4 h-4"/></button>
                        </div>
                    ))}
                </div>}
            </div>

            {/* === SEND MODAL === */}
            {showModal && (
                <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[92vh] flex flex-col">
                        <div className="flex justify-between items-center p-5 border-b shrink-0">
                            <h3 className="font-black text-lg text-gray-800 flex items-center gap-2"><Send className="w-5 h-5 text-blue-600"/>Kirim Notifikasi</h3>
                            <button onClick={()=>setShowModal(false)} className="p-1.5 hover:bg-gray-100 rounded-lg"><X className="w-5 h-5"/></button>
                        </div>
                        <div className="flex flex-1 overflow-hidden">
                            {/* Left: Compose */}
                            <form onSubmit={handleSend} className="flex-1 overflow-y-auto p-5 space-y-4 border-r">
                                {/* Template Picker */}
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Template</label>
                                    <div className="flex flex-wrap gap-2">
                                        {templates.map(t=>(
                                            <button key={t.id} type="button" onClick={()=>applyTemplate(t)}
                                                className="text-xs px-3 py-1.5 rounded-full border border-gray-200 hover:border-blue-400 hover:bg-blue-50 text-gray-700 font-semibold transition">
                                                {t.name}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Tipe & Channel */}
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-1">Tipe</label>
                                        <div className="flex rounded-xl overflow-hidden border border-gray-200">
                                            {['broadcast','personal'].map(t=>(
                                                <button key={t} type="button" onClick={()=>setForm(f=>({...f,type:t,customer_id:''}))}
                                                    className={`flex-1 py-2 text-sm font-bold transition ${form.type===t?'bg-blue-600 text-white':'text-gray-500 hover:bg-gray-50'}`}>
                                                    {t==='broadcast'?'Broadcast':'Personal'}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-1">Channel</label>
                                        <div className="flex rounded-xl overflow-hidden border border-gray-200">
                                            {channelOpts.map(o=>(
                                                <button key={o.val} type="button" onClick={()=>setForm(f=>({...f,channel:o.val}))}
                                                    className={`flex-1 py-2 text-xs font-bold transition flex items-center justify-center gap-1 ${form.channel===o.val?`${o.color} text-white`:'text-gray-500 hover:bg-gray-50'}`}>
                                                    <o.icon className="w-3 h-3"/>{o.label}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                {/* Personal: Customer Select */}
                                {form.type==='personal' && (
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-1">Pelanggan</label>
                                        <select value={form.customer_id} onChange={e=>setForm(f=>({...f,customer_id:e.target.value}))}
                                            className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                                            <option value="">— Pilih Pelanggan —</option>
                                            {customers.map(c=><option key={c.id} value={c.id}>{c.name} ({c.package_name})</option>)}
                                        </select>
                                    </div>
                                )}

                                {/* Judul */}
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1">Judul / Subjek</label>
                                    <input value={form.title} onChange={e=>setForm(f=>({...f,title:e.target.value}))} required
                                        className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        placeholder="Judul notifikasi..."/>
                                </div>

                                {/* Pesan */}
                                <div>
                                    <div className="flex justify-between items-center mb-1">
                                        <label className="block text-sm font-bold text-gray-700">Pesan</label>
                                        <span className="text-xs text-gray-400">{form.message.length} karakter</span>
                                    </div>
                                    <textarea value={form.message} onChange={e=>setForm(f=>({...f,message:e.target.value}))} required rows={5}
                                        className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                                        placeholder="Tulis pesan atau pilih template di atas..."/>
                                    <div className="flex gap-2 mt-2 flex-wrap">
                                        {VARS.map(v=>(
                                            <button key={v} type="button" onClick={()=>insertVar(v)}
                                                className="text-xs px-2 py-1 bg-gray-100 hover:bg-blue-100 hover:text-blue-700 rounded-lg font-mono font-bold transition">
                                                {v}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <button type="submit" disabled={sending}
                                    className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold flex items-center justify-center gap-2 disabled:opacity-50 transition">
                                    {sending?<Loader2 className="w-4 h-4 animate-spin"/>:<Send className="w-4 h-4"/>}
                                    {sending?'Mengirim...':'Kirim Sekarang'}
                                </button>
                            </form>

                            {/* Right: Preview */}
                            <div className="w-96 overflow-y-auto p-5 bg-gray-50/50 flex flex-col gap-4">
                                <div>
                                    <div className="flex items-center gap-2 mb-3">
                                        <Eye className="w-4 h-4 text-gray-400"/>
                                        <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">Preview Langsung</span>
                                    </div>
                                    <div className="flex rounded-xl overflow-hidden border border-gray-200 mb-4">
                                        {[{val:'wa',label:'WhatsApp'},{val:'email',label:'Email'}].map(t=>(
                                            <button key={t.val} type="button" onClick={()=>setPreviewTab(t.val)}
                                                className={`flex-1 py-2 text-sm font-bold transition ${previewTab===t.val?'bg-blue-600 text-white':'text-gray-500 hover:bg-gray-50'}`}>
                                                {t.label}
                                            </button>
                                        ))}
                                    </div>
                                    {previewTab==='wa'
                                        ? <WaPreview title={form.title} message={form.message} customer={selectedCustomer}/>
                                        : <EmailPreview title={form.title} message={form.message} customer={selectedCustomer}/>}
                                </div>
                                {selectedCustomer && (
                                    <div className="bg-white rounded-xl border border-gray-100 p-3 text-xs text-gray-500">
                                        <p className="font-bold text-gray-600 mb-1">Data sample preview:</p>
                                        <p>nama → <span className="font-mono font-bold text-gray-800">{selectedCustomer.name}</span></p>
                                        <p>paket → <span className="font-mono font-bold text-gray-800">{selectedCustomer.package_name}</span></p>
                                        <p>nominal → <span className="font-mono font-bold text-gray-800">Rp 150.000</span></p>
                                        <p>jatuh_tempo → <span className="font-mono font-bold text-gray-800">5 Mei 2026</span></p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* === TEMPLATE MODAL === */}
            {showTplModal && (
                <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl">
                        <div className="flex justify-between items-center p-5 border-b">
                            <h3 className="font-black text-lg text-gray-800">{editTpl?'Edit Template':'Buat Template Baru'}</h3>
                            <button onClick={()=>{setShowTplModal(false);setEditTpl(null);}} className="p-1.5 hover:bg-gray-100 rounded-lg"><X className="w-5 h-5"/></button>
                        </div>
                        <form onSubmit={handleSaveTpl} className="p-5 space-y-4">
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">Nama Template</label>
                                <input value={tplForm.name} onChange={e=>setTplForm(f=>({...f,name:e.target.value}))} required
                                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="e.g. Tagihan Jatuh Tempo"/>
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">Judul / Subjek</label>
                                <input value={tplForm.title} onChange={e=>setTplForm(f=>({...f,title:e.target.value}))} required
                                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="Judul pesan..."/>
                            </div>
                            <div>
                                <div className="flex justify-between items-center mb-1">
                                    <label className="block text-sm font-bold text-gray-700">Isi Pesan</label>
                                </div>
                                <textarea value={tplForm.message} onChange={e=>setTplForm(f=>({...f,message:e.target.value}))} required rows={6}
                                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                                    placeholder="Tulis isi pesan template..."/>
                                <div className="flex gap-2 mt-2 flex-wrap">
                                    {VARS.map(v=>(
                                        <button key={v} type="button" onClick={()=>setTplForm(f=>({...f,message:f.message+v}))}
                                            className="text-xs px-2 py-1 bg-gray-100 hover:bg-blue-100 hover:text-blue-700 rounded-lg font-mono font-bold transition">
                                            {v}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div className="flex justify-end gap-3 pt-2 border-t">
                                <button type="button" onClick={()=>{setShowTplModal(false);setEditTpl(null);}} className="px-4 py-2 text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl font-bold">Batal</button>
                                <button type="submit" className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold flex items-center gap-2">
                                    <Check className="w-4 h-4"/> Simpan Template
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

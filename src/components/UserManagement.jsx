import React, { useState, useEffect } from 'react';
import { 
  Users, UserPlus, Trash2, Edit2, Shield, 
  Check, X, RefreshCw, AlertCircle, Plus, Info
} from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import useHomeContext from '../hooks/UseHomeContext';

export default function UserManagement() {
  const { user: currentUser, refreshPermissions, tablesList } = useHomeContext();
  const [usersList, setUsersList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Form State
  const [isEditing, setIsEditing] = useState(false);
  const [editId, setEditId] = useState(null);
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('user');
  const [selectedTables, setSelectedTables] = useState([]);
  const [customTable, setCustomTable] = useState('');
  const [seeAll, setSeeAll] = useState(false);

  const availableTables = React.useMemo(() => {
    const defaults = ['asc_0003198122', 'asc_0005286953'];
    return Array.from(new Set([...defaults, ...(tablesList || [])]));
  }, [tablesList]);

  // Carrega lista de usuários
  const fetchUsers = async () => {
    setLoading(true);
    setError('');
    try {
      const { data, error: fetchErr } = await supabase
        .from('user_permissions')
        .select('*')
        .order('email', { ascending: true });

      if (fetchErr) throw fetchErr;
      setUsersList(data || []);
    } catch (err) {
      console.error(err);
      setError('Erro ao carregar lista de usuários: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const resetForm = () => {
    setIsEditing(false);
    setEditId(null);
    setEmail('');
    setRole('user');
    setSelectedTables([]);
    setCustomTable('');
    setSeeAll(false);
  };

  const handleTableCheckboxChange = (table) => {
    if (selectedTables.includes(table)) {
      setSelectedTables(selectedTables.filter(t => t !== table));
    } else {
      setSelectedTables([...selectedTables, table]);
    }
  };

  const handleAddCustomTable = () => {
    if (customTable && customTable.trim()) {
      const cleaned = customTable.trim();
      if (!selectedTables.includes(cleaned)) {
        setSelectedTables([...selectedTables, cleaned]);
      }
      setCustomTable('');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !email.trim()) {
      setError('E-mail é obrigatório.');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    let finalTables = seeAll ? ['*'] : [...selectedTables];
    if (finalTables.length === 0) {
      setError('Selecione ao menos uma operação/tabela ou ative "Visualizar todas".');
      setLoading(false);
      return;
    }

    try {
      const payload = {
        email: email.trim().toLowerCase(),
        role,
        allowed_tables: finalTables
      };

      if (isEditing && editId) {
        // Update
        const { error: updateErr } = await supabase
          .from('user_permissions')
          .update(payload)
          .eq('id', editId);
        
        if (updateErr) throw updateErr;
        setSuccess('Permissões do usuário atualizadas com sucesso!');
      } else {
        // Insert
        const { error: insertErr } = await supabase
          .from('user_permissions')
          .insert(payload);
        
        if (insertErr) throw insertErr;
        setSuccess('Novo usuário adicionado com sucesso!');
      }

      resetForm();
      await fetchUsers();
      
      // Se alterou as permissões do próprio usuário logado, atualiza na sessão
      if (email.trim().toLowerCase() === currentUser?.email?.toLowerCase()) {
        await refreshPermissions();
      }
    } catch (err) {
      console.error(err);
      setError('Erro ao salvar usuário: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEditClick = (usr) => {
    setIsEditing(true);
    setEditId(usr.id);
    setEmail(usr.email);
    setRole(usr.role);
    const hasWildcard = usr.allowed_tables?.includes('*');
    setSeeAll(hasWildcard);
    if (hasWildcard) {
      setSelectedTables([]);
    } else {
      setSelectedTables(usr.allowed_tables || []);
    }
    setSuccess('');
    setError('');
  };

  const handleDeleteClick = async (id, userEmail) => {
    if (userEmail.toLowerCase() === currentUser?.email?.toLowerCase()) {
      alert('Você não pode excluir suas próprias permissões administrativas!');
      return;
    }

    if (!window.confirm(`Tem certeza de que deseja excluir as permissões do usuário ${userEmail}?`)) {
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const { error: delErr } = await supabase
        .from('user_permissions')
        .delete()
        .eq('id', id);

      if (delErr) throw delErr;
      setSuccess('Usuário removido com sucesso!');
      await fetchUsers();
    } catch (err) {
      console.error(err);
      setError('Erro ao remover usuário: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8 animate-fadeIn px-4 py-2 font-sans">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center gap-4 bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm">
        <div className="p-3 bg-gradient-to-br from-blue-500 to-indigo-650 text-white rounded-xl shadow-lg shadow-blue-500/10 shrink-0 self-start md:self-auto">
          <Users size={28} />
        </div>
        <div>
          <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
            Gerenciamento de Usuários
            <span className="text-[9px] uppercase font-bold px-2 py-0.5 bg-blue-50 text-blue-600 border border-blue-200/50 rounded-full tracking-wider">
              Segurança
            </span>
          </h2>
          <p className="text-xs text-slate-500 mt-1 max-w-3xl">
            Adicione novos usuários autorizados a acessar os dados corporativos. Configure quais bases/operações do Supabase cada um tem permissão para visualizar e se possuem cargo de administrador.
          </p>
        </div>
      </div>

      {/* Messages */}
      {error && (
        <div className="flex items-center gap-2 bg-rose-50 border border-rose-200 text-rose-700 px-4 py-3 rounded-xl text-xs font-bold shadow-sm animate-fadeIn">
          <AlertCircle size={16} />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-250 text-emerald-800 px-4 py-3 rounded-xl text-xs font-bold shadow-sm animate-fadeIn">
          <Check size={16} />
          <span>{success}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Formulário Cadastro / Edição */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm lg:col-span-1 h-fit">
          <div className="flex items-center gap-3 border-b border-slate-100 pb-4 mb-4">
            <div className="p-2 bg-blue-55 bg-blue-50 text-blue-600 rounded-lg border border-blue-100">
              <UserPlus size={18} />
            </div>
            <h3 className="text-sm font-bold text-slate-800">
              {isEditing ? 'Editar Usuário' : 'Novo Usuário'}
            </h3>
            {isEditing && (
              <button 
                onClick={resetForm}
                className="ml-auto text-xs text-slate-400 hover:text-slate-600 flex items-center gap-1 font-semibold"
              >
                <X size={14} /> Cancelar
              </button>
            )}
          </div>

          <form onSubmit={handleSubmit} className="space-y-5 text-xs font-semibold text-slate-650">
            {/* Campo E-mail */}
            <div className="space-y-1.5">
              <label className="text-slate-500 font-bold block uppercase tracking-wider">E-mail Corporativo</label>
              <input
                type="email"
                required
                disabled={isEditing || loading}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="usuario@empresa.com"
                className="w-full bg-slate-50 text-slate-800 placeholder-slate-400 border border-slate-200 rounded-lg px-3 py-2 text-xs font-medium focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 transition-all disabled:opacity-60"
              />
            </div>

            {/* Cargo / Role */}
            <div className="space-y-1.5">
              <label className="text-slate-500 font-bold block uppercase tracking-wider">Cargo / Tipo de Usuário</label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                disabled={loading}
                className="w-full bg-slate-50 text-slate-800 border border-slate-200 rounded-lg px-3 py-2 text-xs font-medium focus:outline-none focus:border-blue-500 cursor-pointer"
              >
                <option value="user">Usuário Comum (Visualizador)</option>
                <option value="admin">Administrador (Controle Total)</option>
              </select>
            </div>

            {/* Permissões de Visualização */}
            <div className="space-y-2 border-t border-slate-100 pt-4">
              <div className="flex justify-between items-center mb-1.5">
                <label className="text-slate-500 font-bold uppercase tracking-wider">Operações Permitidas</label>
                
                <label className="flex items-center gap-1 text-[10px] text-blue-600 cursor-pointer font-bold select-none">
                  <input
                    type="checkbox"
                    checked={seeAll}
                    onChange={(e) => setSeeAll(e.target.checked)}
                    className="rounded border-slate-350 text-blue-600 focus:ring-blue-500/20"
                  />
                  <span>Ver todas (*)</span>
                </label>
              </div>

              {!seeAll ? (
                <div className="space-y-2">
                  <p className="text-[10px] text-slate-400 font-medium">Selecione quais tabelas o usuário poderá visualizar no dropdown:</p>
                  
                  {/* Tabelas Padrão */}
                  <div className="space-y-1.5 bg-slate-50 p-2.5 rounded-lg border border-slate-150">
                    {availableTables.map((table) => (
                      <label key={table} className="flex items-center gap-2 text-slate-700 font-bold text-xs cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={selectedTables.includes(table)}
                          onChange={() => handleTableCheckboxChange(table)}
                          className="rounded border-slate-350 text-blue-600 focus:ring-blue-500/20"
                        />
                        <span>{table}</span>
                      </label>
                    ))}
                    {selectedTables.filter(t => !availableTables.includes(t)).map((table) => (
                      <label key={table} className="flex items-center gap-2 text-slate-700 font-bold text-xs cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={selectedTables.includes(table)}
                          onChange={() => handleTableCheckboxChange(table)}
                          className="rounded border-slate-350 text-blue-600 focus:ring-blue-500/20"
                        />
                        <span className="text-indigo-650">{table}</span>
                      </label>
                    ))}
                  </div>

                  {/* Adicionar tabela personalizada */}
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Outro nome de tabela..."
                      value={customTable}
                      onChange={(e) => setCustomTable(e.target.value)}
                      className="flex-1 bg-slate-50 text-slate-800 placeholder-slate-400 border border-slate-200 rounded-lg px-2.5 py-1.5 text-[11px] font-medium focus:outline-none focus:border-blue-500"
                    />
                    <button
                      type="button"
                      onClick={handleAddCustomTable}
                      className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 rounded-lg flex items-center justify-center transition-all"
                    >
                      <Plus size={14} />
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex gap-2 items-start bg-blue-50/50 border border-blue-100 text-blue-800 p-3 rounded-lg text-[10px]">
                  <Info size={16} className="shrink-0 mt-0.5 text-blue-500" />
                  <p className="font-semibold leading-normal">
                    Com a permissão global ativa, o usuário terá acesso irrestrito a todas as operações (tabelas) da nuvem cadastradas no sistema.
                  </p>
                </div>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-bold py-2.5 px-4 rounded-lg text-xs transition-all duration-200 shadow-md shadow-blue-600/10"
            >
              {loading ? (
                <>
                  <RefreshCw size={14} className="animate-spin" />
                  <span>Salvando...</span>
                </>
              ) : (
                <>
                  <Check size={14} />
                  <span>{isEditing ? 'Salvar Alterações' : 'Adicionar Usuário'}</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* Lista de Usuários */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm lg:col-span-2 flex flex-col min-h-[450px]">
          <div className="flex items-center gap-3 border-b border-slate-100 pb-4 mb-4">
            <div className="p-2 bg-indigo-50 text-indigo-650 rounded-lg border border-indigo-100">
              <Shield size={18} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-800">Usuários Cadastrados</h3>
              <p className="text-[11px] text-slate-400 mt-0.5">Gestão de cargos e controle de acessos</p>
            </div>
            <span className="ml-auto text-xs font-bold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700">
              {usersList.length}
            </span>
          </div>

          <div className="flex-1 overflow-x-auto">
            {usersList.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <Users size={36} className="text-slate-300 mb-2" />
                <p className="text-xs font-bold text-slate-600">Nenhum usuário cadastrado</p>
                <p className="text-[10px] text-slate-400 mt-1 max-w-[240px]">
                  Todos os acessos estão trancados até que permissões de e-mail sejam criadas.
                </p>
              </div>
            ) : (
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-100 text-slate-400 uppercase font-extrabold text-[9px] tracking-wider">
                    <th className="py-3 px-2">Usuário / E-mail</th>
                    <th className="py-3 px-2">Cargo</th>
                    <th className="py-3 px-2">Operações Permitidas</th>
                    <th className="py-3 px-2 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {usersList.map((usr) => (
                    <tr 
                      key={usr.id}
                      className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors"
                    >
                      <td className="py-3.5 px-2 font-bold text-slate-800">
                        {usr.email}
                        {usr.email?.toLowerCase() === currentUser?.email?.toLowerCase() && (
                          <span className="ml-1.5 text-[8.5px] uppercase px-1.5 py-0.5 bg-blue-50 text-blue-600 border border-blue-150 rounded font-black">
                            Você
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-2">
                        <span className={`text-[9.5px] font-extrabold px-2 py-0.5 rounded-full uppercase ${
                          usr.role === 'admin' 
                            ? 'bg-purple-50 text-purple-700 border border-purple-150' 
                            : 'bg-slate-100 text-slate-600 border border-slate-200'
                        }`}>
                          {usr.role === 'admin' ? 'Admin' : 'Usuário'}
                        </span>
                      </td>
                      <td className="py-3.5 px-2 max-w-[200px]">
                        {usr.allowed_tables?.includes('*') ? (
                          <span className="text-[10px] font-extrabold text-indigo-700 bg-indigo-50 border border-indigo-150 px-2 py-0.5 rounded-full uppercase">
                            Todas (*)
                          </span>
                        ) : (
                          <div className="flex flex-wrap gap-1">
                            {usr.allowed_tables?.map(t => (
                              <span key={t} className="text-[9.5px] font-bold text-slate-600 bg-slate-100 border border-slate-200 px-1.5 py-0.5 rounded font-mono">
                                {t}
                              </span>
                            ))}
                          </div>
                        )}
                      </td>
                      <td className="py-3.5 px-2 text-right">
                        <div className="flex justify-end gap-1.5">
                          <button
                            onClick={() => handleEditClick(usr)}
                            className="p-1 text-slate-400 hover:text-blue-600 hover:bg-slate-100 rounded-md transition-colors"
                            title="Editar permissões"
                          >
                            <Edit2 size={13} />
                          </button>
                          <button
                            onClick={() => handleDeleteClick(usr.id, usr.email)}
                            disabled={usr.email?.toLowerCase() === currentUser?.email?.toLowerCase()}
                            className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors disabled:opacity-40"
                            title="Excluir permissões"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}

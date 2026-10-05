'use client'

import React, { useState, useEffect } from 'react'
import { CheckCircle2, Circle, Lock, Unlock, Plus, RefreshCw, User, Calendar, Folder, Award, Layers, History, ShieldAlert, LogOut, CheckSquare, Trash2, X, KeyRound, Edit2 } from 'lucide-react'
import { supabase } from '@/lib/supabase'

export default function Dashboard() {
  // -------------------------------------------------------------
  // SISTEMA DE SEGURANÇA (Porta de Entrada)
  // -------------------------------------------------------------
  const [autenticado, setAutenticado] = useState(false)
  const [verificandoSessao, setVerificandoSessao] = useState(true)
  const [senhaInput, setSenhaInput] = useState('')
  const [erroSenha, setErroSenha] = useState(false)
  const [usuarioSelecionadoLogin, setUsuarioSelecionadoLogin] = useState<'Luck' | 'Grazy'>('Luck')

  // Usuários do sistema
  const [usuarioAtivo, setUsuarioAtivo] = useState<'Luck' | 'Grazy'>('Luck')

  // Verifica se o usuário já fez login antes neste celular/PC e quem é o dono do aparelho
  useEffect(() => {
    const sessaoSalva = localStorage.getItem('eg_auth')
    const usuarioSalvo = localStorage.getItem('eg_user') as 'Luck' | 'Grazy' | null

    if (usuarioSalvo) {
      setUsuarioAtivo(usuarioSalvo)
      setUsuarioSelecionadoLogin(usuarioSalvo)
    }

    if (sessaoSalva === 'aprovado') {
      setAutenticado(true)
    }
    setVerificandoSessao(false)
  }, [])

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault()
    // A SENHA OFICIAL DE VOCÊS:
    if (senhaInput === 'JesusCristo') { 
      localStorage.setItem('eg_auth', 'aprovado')
      localStorage.setItem('eg_user', usuarioSelecionadoLogin)
      setUsuarioAtivo(usuarioSelecionadoLogin)
      setAutenticado(true)
      setErroSenha(false)
    } else {
      setErroSenha(true)
    }
  }
  // -------------------------------------------------------------
  const [contexto, setContexto] = useState<'Marketing' | 'Prospecção'>('Marketing')
  
  // Lista de tarefas (inicia vazia para buscarmos do banco de dados/testes)
  const [tarefas, setTarefas] = useState<any[]>([])
  const [carregando, setCarregando] = useState(true)
  
  // Controle de Navegação (Tarefas, Histórico, Visão Geral)
  const [abaAtiva, setAbaAtiva] = useState<'tarefas' | 'historico' | 'visao_geral'>('tarefas')
  
  // Filtro de abas internas no mobile
  const [filtroMobile, setFiltroMobile] = useState<'minhas' | 'socio' | 'bloqueadas'>('minhas')

  // Estados do Modal de Criação e Edição de Tarefa
  const [modalAberto, setModalAberto] = useState(false)
  const [tarefaEditandoId, setTarefaEditandoId] = useState<string | null>(null) // Guarda o ID se estiver editando
  const [formTitulo, setFormTitulo] = useState('')
  const [formNicho, setFormNicho] = useState('Criação de Sites')
  const [formContexto, setFormContexto] = useState<'Marketing' | 'Prospecção'>('Marketing')
  const [formResponsavel, setFormResponsavel] = useState<'Luck' | 'Grazy'>('Luck')
  const [formPrioridade, setFormPrioridade] = useState<'baixa' | 'media' | 'alta'>('media')
  const [formDependencia, setFormDependencia] = useState('') // Guarda a tarefa bloqueadora
  const [formRecorrente, setFormRecorrente] = useState(false)
  
  // Estados do Checklist
  const [formSubtarefas, setFormSubtarefas] = useState<string[]>([])
  const [novaSubtarefa, setNovaSubtarefa] = useState('')
  // Controle do Modal de Confirmação (Excluir / Concluir)
  const [modalConfirmacao, setModalConfirmacao] = useState<{aberto: boolean, tipo: 'excluir' | 'concluir' | null, tarefaId: string}>({ aberto: false, tipo: null, tarefaId: '' })

  // Controle do Modal iOS de Canais e Remessas
  const [modalRemessasAberto, setModalRemessasAberto] = useState(false)
  const [tarefaSelecionadaRemessas, setTarefaSelecionadaRemessas] = useState<any | null>(null)
  const [canalSelecionado, setCanalSelecionado] = useState<any | null>(null) // Para navegar até o nível 2

  // Alterna uma remessa específica (ex: Remessa 1, 2, 3...)
  const handleToggleRemessa = async (subtarefaId: string, numeroRemessa: number) => {
    if (!tarefaSelecionadaRemessas) return

    const subAlvo = tarefaSelecionadaRemessas.subtarefas?.find((s: any) => s.id === subtarefaId)
    if (!subAlvo) return

    const remessasAtuais: number[] = subAlvo.remessas_feitas || []
    const jaFez = remessasAtuais.includes(numeroRemessa)
    const novasRemessas = jaFez 
      ? remessasAtuais.filter(r => r !== numeroRemessa)
      : [...remessasAtuais, numeroRemessa]

    // Se concluiu todas as 5 remessas, podemos marcar concluida = true
    const totalSlots = subAlvo.remessas_total || 5
    const estaCompleto = novasRemessas.length >= totalSlots

    // Atualização otimista na tela na hora
    const subAtualizada = { ...subAlvo, remessas_feitas: novasRemessas, concluida: estaCompleto }
    const tarefasAtualizadas = tarefas.map(t => {
      if (t.id === tarefaSelecionadaRemessas.id) {
        return {
          ...t,
          subtarefas: t.subtarefas.map((s: any) => s.id === subtarefaId ? subAtualizada : s)
        }
      }
      return t
    })
    setTarefas(tarefasAtualizadas)
    setTarefaSelecionadaRemessas({
      ...tarefaSelecionadaRemessas,
      subtarefas: tarefaSelecionadaRemessas.subtarefas.map((s: any) => s.id === subtarefaId ? subAtualizada : s)
    })
    if (canalSelecionado?.id === subtarefaId) {
      setCanalSelecionado(subAtualizada)
    }

    try {
      await supabase
        .from('subtarefas')
        .update({ remessas_feitas: novasRemessas, concluida: estaCompleto })
        .eq('id', subtarefaId)
    } catch (err) {
      console.error('Erro ao atualizar remessa:', err)
      buscarTarefas()
    }
  }

  // Estado para controlar a tarefa que está sendo arrastada no momento
  const [tarefaArrastadaId, setTarefaArrastadaId] = useState<string | null>(null)

  // Busca tarefas reais do banco de dados (Ordenadas pelo campo ordem manual)
  const buscarTarefas = async () => {
    try {
      setCarregando(true)
      const { data, error } = await supabase
        .from('tarefas')
        .select('*, subtarefas(*)')
        .order('ordem', { ascending: true })

      if (error) throw error
      if (data) {
        const hojeStr = new Date().toISOString().split('T')[0]

        const tarefasFormatadas = await Promise.all(data.map(async (t: any) => {
          const subsOrdenadas = t.subtarefas?.sort((a: any, b: any) => (a.ordem ?? 0) - (b.ordem ?? 0)) || []
          
          // Se for recorrente, mas foi concluída em um dia anterior, reseta para pendente automaticamente
          let statusAtual = t.status
          if (t.recorrente && t.status === 'concluido' && t.ultima_conclusao && t.ultima_conclusao < hojeStr) {
            statusAtual = 'pendente'
            // Atualiza no banco em background para o novo ciclo
            await supabase.from('tarefas').update({ status: 'pendente' }).eq('id', t.id)
            await supabase.from('subtarefas').update({ concluida: false, remessas_feitas: [] }).eq('tarefa_pai_id', t.id)
          }

          return {
            id: t.id,
            titulo: t.titulo,
            responsavel: t.responsavel_nome || 'Luck',
            status: statusAtual,
            nicho: t.nicho_nome || 'EG',
            contexto: t.contexto || 'Marketing',
            prioridade: t.prioridade,
            recorrente: t.recorrente,
            ordem: t.ordem ?? 0,
            ultimaConclusao: t.ultima_conclusao,
            subtarefas: subsOrdenadas,
            dependeDe: t.depende_de
          }
        }))
        setTarefas(tarefasFormatadas)
      }
    } catch (error) {
      console.error('Erro ao buscar tarefas:', error)
    } finally {
      setCarregando(false)
    }
  }

  // Detecta o dia, busca tarefas e LIGA O TEMPO REAL
  useEffect(() => {
    const diaSemana = new Date().getDay()
    if (diaSemana === 1 || diaSemana === 3 || diaSemana === 5) {
      setContexto('Prospecção')
    } else {
      setContexto('Marketing')
    }
    buscarTarefas()

    // OUVINTE DE TEMPO REAL: Fica escutando qualquer clique de vocês dois no banco
    const canalTarefas = supabase.channel('mudancas-banco')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tarefas' }, () => {
        buscarTarefas()
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'subtarefas' }, () => {
        buscarTarefas()
      })
      .subscribe()

    return () => {
      supabase.removeChannel(canalTarefas) // Desliga ao fechar o painel
    }
  }, [])

  // Função para abrir o modal preenchido para edição
  const handleAbrirEdicao = (tarefa: any) => {
    setTarefaEditandoId(tarefa.id)
    setFormTitulo(tarefa.titulo)
    setFormNicho(tarefa.nicho)
    setFormContexto(tarefa.contexto)
    setFormResponsavel(tarefa.responsavel)
    setFormPrioridade(tarefa.prioridade || 'media')
    setFormDependencia(tarefa.dependeDe || '')
    setFormRecorrente(tarefa.recorrente || false)
    setFormSubtarefas(tarefa.subtarefas ? tarefa.subtarefas.map((s: any) => s.titulo) : [])
    setNovaSubtarefa('')
    setModalAberto(true)
  }

  // Função para salvar (Criação ou Edição de tarefa)
  const handleSalvarTarefa = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formTitulo.trim()) return

    try {
      const dadosTarefaDB = {
        titulo: formTitulo,
        responsavel_nome: formResponsavel,
        prioridade: formPrioridade,
        recorrente: formRecorrente,
        nicho_nome: formNicho,
        contexto: formContexto,
        depende_de: formDependencia || null,
        data_planejada: new Date().toISOString().split('T')[0]
      }

      if (tarefaEditandoId) {
        // MODO EDIÇÃO: Atualiza a tarefa existente
        const { error } = await supabase
          .from('tarefas')
          .update(dadosTarefaDB)
          .eq('id', tarefaEditandoId)

        if (error) throw error

        // Atualiza os checklists: remove os anteriores e insere os novos
        await supabase.from('subtarefas').delete().eq('tarefa_pai_id', tarefaEditandoId)

        if (formSubtarefas.length > 0) {
          const subsDB深 = formSubtarefas.map((sub, index) => ({
            tarefa_pai_id: tarefaEditandoId,
            titulo: sub,
            ordem: index
          }))
          await supabase.from('subtarefas').insert(subsDB深)
        }
      } else {
        // MODO CRIAÇÃO: Cria nova tarefa
        const { data: tarefaSalva, error } = await supabase
          .from('tarefas')
          .insert([{ ...dadosTarefaDB, status: 'pendente' }])
          .select()
          .single()

        if (error) throw error

        if (formSubtarefas.length > 0 && tarefaSalva) {
          const subsDB = formSubtarefas.map((sub, index) => ({
            tarefa_pai_id: tarefaSalva.id,
            titulo: sub,
            ordem: index
          }))
          await supabase.from('subtarefas').insert(subsDB)
        }
      }

      // Limpa formulário e fecha modal
      setTarefaEditandoId(null)
      setFormTitulo('')
      setFormDependencia('')
      setFormSubtarefas([])
      setNovaSubtarefa('')
      setModalAberto(false)
      
      buscarTarefas()
    } catch (error) {
      alert('Erro ao salvar tarefa!')
      console.error(error)
    }
  }

  // Salva o novo status e a data da última conclusão
  const handleToggleTarefaStatus = async (tarefaId: string) => {
    const tarefaAlvo = tarefas.find(t => t.id === tarefaId)
    if (!tarefaAlvo) return

    const vaiConcluir = tarefaAlvo.status !== 'concluido'
    const novoStatus = vaiConcluir ? 'concluido' : 'pendente'
    const hojeStr = new Date().toISOString().split('T')[0]

    try {
      const { error } = await supabase
        .from('tarefas')
        .update({ 
          status: novoStatus,
          ultima_conclusao: vaiConcluir ? hojeStr : null 
        })
        .eq('id', tarefaId)

      if (error) throw error
      
      buscarTarefas()
    } catch (error) {
      console.error('Erro ao atualizar status da tarefa:', error)
    }
  }

// Exclui a tarefa do banco
  const handleExcluirTarefa = async (tarefaId: string) => {

    try {
      const { error } = await supabase.from('tarefas').delete().eq('id', tarefaId)
      if (error) throw error
      buscarTarefas()
    } catch (error) {
      console.error('Erro ao excluir:', error)
    }
  }

  // Atualiza o status de uma etapa do checklist
  const handleToggleSubtarefa = async (subId: string, statusAtual: boolean) => {
    try {
      const { error } = await supabase.from('subtarefas').update({ concluida: !statusAtual }).eq('id', subId)
      if (error) throw error
      buscarTarefas()
    } catch (error) {
      console.error('Erro ao atualizar subtarefa:', error)
    }
  }

  // Verifica bloqueio de tarefas
  const verificarBloqueio = (tarefa: any) => {
    if (!tarefa.dependeDe) return false
    const tarefaBloqueadora = tarefas.find(t => t.id === tarefa.dependeDe)
    return tarefaBloqueadora ? tarefaBloqueadora.status !== 'concluido' : false
  }

  // -------------------------------------------------------------
  // CONTROLE DE ARRASTAR E SOLTAR NATIVO (MOUSE + TOUCH MOBILE)
  // -------------------------------------------------------------
  const timerLongPressRef = React.useRef<NodeJS.Timeout | null>(null)
  const [modoOrdenacaoAtivo, setModoOrdenacaoAtivo] = useState(false)

  // Inicia o timer de 550ms ao pressionar
  const iniciarPress = (tarefaId: string) => {
    cancelarPress()
    timerLongPressRef.current = setTimeout(() => {
      setTarefaArrastadaId(tarefaId)
      setModoOrdenacaoAtivo(true)
      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        navigator.vibrate(40) // Vibração tátil sutil no mobile se suportado
      }
    }, 550)
  }

  // Cancela o timer se soltar antes do tempo
  const cancelarPress = () => {
    if (timerLongPressRef.current) {
      clearTimeout(timerLongPressRef.current)
      timerLongPressRef.current = null
    }
  }

  // Troca a posição e salva no banco
  const moverTarefaParaPosicao = async (tarefaAlvoId: string) => {
    if (!tarefaArrastadaId || tarefaArrastadaId === tarefaAlvoId) return

    const indexArrastada = tarefas.findIndex(t => t.id === tarefaArrastadaId)
    const indexAlvo = tarefas.findIndex(t => t.id === tarefaAlvoId)

    if (indexArrastada === -1 || indexAlvo === -1) return

    const novaLista = [...tarefas]
    const [tarefaMovida] = novaLista.splice(indexArrastada, 1)
    novaLista.splice(indexAlvo, 0, tarefaMovida)

    const listaComNovaOrdem = novaLista.map((t, idx) => ({ ...t, ordem: idx }))
    setTarefas(listaComNovaOrdem)

    try {
      const updates = listaComNovaOrdem.map(t => 
        supabase.from('tarefas').update({ ordem: t.ordem }).eq('id', t.id)
      )
      await Promise.all(updates)
    } catch (err) {
      console.error('Erro ao salvar ordem no banco:', err)
      buscarTarefas()
    }
  }

  const finalizarArraste = () => {
    cancelarPress()
    setTarefaArrastadaId(null)
    setModoOrdenacaoAtivo(false)
  }

  // Suporte a toque contínuo no mobile (Arrastar pelo touch)
  const handleTouchMove = (e: React.TouchEvent) => {
    if (!tarefaArrastadaId || !modoOrdenacaoAtivo) return
    const touch = e.touches[0]
    const elementoSobDedo = document.elementFromPoint(touch.clientX, touch.clientY)
    const cardAlvo = elementoSobDedo?.closest('[data-tarefa-id]') as HTMLElement
    if (cardAlvo) {
      const idAlvo = cardAlvo.getAttribute('data-tarefa-id')
      if (idAlvo && idAlvo !== tarefaArrastadaId) {
        moverTarefaParaPosicao(idAlvo)
      }
    }
  }
  // -------------------------------------------------------------

  // Filtros de tarefas (Leva em consideração o Contexto ativo e esconde tarefas já concluídas)
  const obterTarefasPorFiltro = (tipo: 'minhas' | 'socio' | 'bloqueadas') => {
    return tarefas.filter(tarefa => {
      // Tarefas concluídas não devem aparecer no fluxo de execução ativo
      if (tarefa.status === 'concluido') return false

      // Regra: Pertence ao contexto ativo no painel (Marketing ou Prospecção)?
      if (tarefa.contexto && tarefa.contexto !== contexto) return false

      const bloqueada = verificarBloqueio(tarefa)
      if (tipo === 'minhas') return tarefa.responsavel === usuarioAtivo && !bloqueada
      if (tipo === 'socio') return tarefa.responsavel !== usuarioAtivo && !bloqueada
      if (tipo === 'bloqueadas') return bloqueada
      return true
    })
  }

  // TELA DE VERIFICAÇÃO RÁPIDA (Evita piscar o painel antes de ver se tem senha)
  if (verificandoSessao) return <div className="min-h-screen bg-slate-950"></div>

  // TELA DE LOGIN ESCURA (A Barreira)
  if (!autenticado) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 antialiased selection:bg-blue-900">
        <div className="w-full max-w-sm animate-in fade-in slide-in-from-bottom-4 duration-500">
          
          <div className="flex flex-col items-center text-center mb-6">
            <div className="w-20 h-20 bg-slate-900 rounded-3xl p-1 mb-3 shadow-2xl shadow-blue-900/20 border border-slate-800 flex items-center justify-center">
              <img src="/logo-eg.png" alt="Logo EG" className="w-full h-full object-contain" />
            </div>
            <h1 className="text-xl font-black text-white tracking-tight uppercase">EG Empório Digital</h1>
            <p className="text-xs font-semibold text-slate-400 mt-1">Selecione quem está acessando</p>
          </div>

          <form onSubmit={handleLogin} className="bg-slate-900/50 backdrop-blur-xl border border-slate-800 p-6 rounded-3xl shadow-xl space-y-5">
            
            {/* Seletor de Perfil: Luck ou Grazy */}
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setUsuarioSelecionadoLogin('Luck')}
                className={`py-3.5 px-3 rounded-2xl border text-xs font-black transition-all flex flex-col items-center gap-1.5 active:scale-95 ${
                  usuarioSelecionadoLogin === 'Luck'
                    ? 'bg-blue-600/20 border-blue-500 text-blue-300 shadow-md shadow-blue-500/20'
                    : 'bg-slate-950/60 border-slate-800 text-slate-500 hover:text-slate-300'
                }`}
              >
                <div className={`p-2 rounded-xl ${usuarioSelecionadoLogin === 'Luck' ? 'bg-blue-500 text-white' : 'bg-slate-800 text-slate-400'}`}>
                  <User size={16} strokeWidth={2.5} />
                </div>
                Luck
              </button>

              <button
                type="button"
                onClick={() => setUsuarioSelecionadoLogin('Grazy')}
                className={`py-3.5 px-3 rounded-2xl border text-xs font-black transition-all flex flex-col items-center gap-1.5 active:scale-95 ${
                  usuarioSelecionadoLogin === 'Grazy'
                    ? 'bg-pink-600/20 border-pink-500 text-pink-300 shadow-md shadow-pink-500/20'
                    : 'bg-slate-950/60 border-slate-800 text-slate-500 hover:text-slate-300'
                }`}
              >
                <div className={`p-2 rounded-xl ${usuarioSelecionadoLogin === 'Grazy' ? 'bg-pink-500 text-white' : 'bg-slate-800 text-slate-400'}`}>
                  <User size={16} strokeWidth={2.5} />
                </div>
                Grazy
              </button>
            </div>

            {/* Input da Senha */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider ml-1">
                Senha de Acesso ({usuarioSelecionadoLogin})
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <KeyRound size={16} className={erroSenha ? "text-red-500" : "text-blue-500"} />
                </div>
                <input 
                  type="password" 
                  value={senhaInput}
                  onChange={(e) => setSenhaInput(e.target.value)}
                  placeholder="••••••••"
                  className={`w-full bg-slate-950 border ${erroSenha ? 'border-red-900 focus:border-red-500' : 'border-slate-800 focus:border-blue-500'} text-white rounded-2xl pl-11 pr-4 py-3.5 text-sm focus:outline-none transition`}
                  required
                />
              </div>
              {erroSenha && <p className="text-[10px] font-bold text-red-500 ml-1 mt-1">Senha incorreta. Tente novamente.</p>}
            </div>

            <button 
              type="submit" 
              className="w-full py-3.5 bg-blue-600 hover:bg-blue-500 text-white font-black rounded-2xl text-sm active:scale-[0.98] transition shadow-lg shadow-blue-900/40"
            >
              Entrar como {usuarioSelecionadoLogin}
            </button>
          </form>

        </div>
      </div>
    )
  }

  // --- SE CHEGOU ATÉ AQUI, A PESSOA ACERTOU A SENHA E VÊ O PAINEL ABAIXO ---

  const totalTarefas = tarefas.length
  const tarefasConcluidas = tarefas.filter(t => t.status === 'concluido').length
  const porcentagemProgresso = totalTarefas > 0 ? Math.round((tarefasConcluidas / totalTarefas) * 100) : 0

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 antialiased font-sans flex flex-col md:flex-row">
      
      {/* ------------------------------------------------------------------ */}
      {/* MENU LATERAL ESQUERDO (Apenas Desktop - Azul Técnico Premium) */}
      {/* ------------------------------------------------------------------ */}
      <aside className="hidden md:flex flex-col w-64 bg-slate-900 text-white shrink-0 shadow-xl border-r border-slate-950">
        
        {/* Espaço Logo EG ampliado no Topo do Menu */}
        <div className="px-6 py-5 border-b border-slate-850 flex flex-col items-center">
          {/* Logo ampliado usando scale para não empurrar o layout pra baixo */}
          <div className="w-24 h-24 flex items-center justify-center rounded-3xl overflow-visible mb-2">
            <img 
              src="/logo-eg.png" 
              alt="Logo EG" 
              className="w-full h-full object-contain scale-[1.45] drop-shadow-2xl hover:scale-[1.55] transition-transform duration-500"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
              }}
            />
          </div>
          <div className="text-center relative z-10 mt-2">
            <h1 className="text-[11px] font-black tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-300 uppercase">Empório Digital</h1>
            <p className="text-[10px] font-medium text-slate-500 mt-0.5">Painel de Operações</p>
          </div>
        </div>

        {/* Itens do Menu Lateral */}
        <nav className="flex-1 p-4 space-y-1.5">
          <button 
            onClick={() => setAbaAtiva('tarefas')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${
              abaAtiva === 'tarefas' 
                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/10' 
                : 'text-slate-400 hover:bg-slate-800/50 hover:text-white'
            }`}
          >
            <Layers size={18} />
            Minhas Tarefas
          </button>

          <button 
            onClick={() => setAbaAtiva('historico')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${
              abaAtiva === 'historico' 
                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/10' 
                : 'text-slate-400 hover:bg-slate-800/50 hover:text-white'
            }`}
          >
            <History size={18} />
            Histórico de Conclusão
          </button>

          <button 
            onClick={() => setAbaAtiva('visao_geral')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${
              abaAtiva === 'visao_geral' 
                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/10' 
                : 'text-slate-400 hover:bg-slate-800/50 hover:text-white'
            }`}
          >
            <ShieldAlert size={18} />
            Visão Geral / KPIs
          </button>
        </nav>

        {/* Rodapé do Menu (Opção de Logout) */}
        <div className="p-4 border-t border-slate-850">
          <button 
            onClick={() => {
              localStorage.removeItem('eg_auth')
              setAutenticado(false)
              setSenhaInput('')
            }}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold text-slate-400 hover:bg-red-500/10 hover:text-red-400 transition"
          >
            <LogOut size={18} />
            Trancar Painel
          </button>
        </div>
      </aside>

      {/* ------------------------------------------------------------------ */}
      {/* ÁREA DE CONTEÚDO PRINCIPAL (PC e Mobile) */}
      {/* ------------------------------------------------------------------ */}
      <div className="flex-1 flex flex-col min-w-0">
        
        {/* Header Superior Premium (Dark no Mobile / Light no PC) */}
        <header className="sticky top-0 z-40 border-b border-slate-800 md:border-slate-200/60 bg-slate-900 md:bg-white/80 md:backdrop-blur-2xl px-4 py-4 md:shadow-[0_4px_20px_-10px_rgba(0,0,0,0.08)] transition-all">
          <div className="mx-auto max-w-7xl flex items-center justify-between">
            
            {/* IMAGEM HORIZONTAL (Visível apenas no Mobile) */}
            <div className="block md:hidden h-12 w-full">
              {/* COLOQUE O NOME DA SUA IMAGEM ABAIXO EM src="" */}
              <img 
                src="/sua-imagem-horizontal.png" 
                alt="Logo EG Horizontal" 
                className="h-full w-auto object-contain object-left origin-left scale-[4.0]"
              />
            </div>

            {/* Título de Boas-vindas ou Visão no PC */}
            <div className="hidden md:block">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1 block">Gestão Estratégica</span>
              <h2 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-slate-800 via-slate-700 to-slate-500 leading-none">
                Luck & Grazy
              </h2>
            </div>

            {/* Controles de Contexto e Usuário (Escondido no Mobile, Visível no PC) */}
            <div className="hidden md:flex items-center gap-3 md:gap-4">
              
              <div className="flex items-center gap-3 bg-white px-4 py-2.5 rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center gap-1.5">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wide">Dia de:</span>
                  <span className="text-xs font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600 uppercase tracking-wider">{contexto}</span>
                </div>
                <div className="w-px h-4 bg-slate-200 mx-1"></div>
                <button 
                  onClick={() => setContexto(prev => prev === 'Marketing' ? 'Prospecção' : 'Marketing')}
                  className="p-1.5 rounded-lg bg-slate-50 hover:bg-blue-50 text-slate-400 hover:text-blue-600 transition-all duration-300 active:rotate-180 hover:scale-110"
                  title="Trocar Contexto"
                >
                  <RefreshCw size={14} strokeWidth={2.5} />
                </button>
              </div>

              {/* Botão de Alternância de Usuário unificado Premium (Cores Dinâmicas) */}
              <button 
                onClick={() => setUsuarioAtivo(prev => prev === 'Luck' ? 'Grazy' : 'Luck')}
                className={`group flex items-center gap-2.5 px-4 py-2.5 rounded-2xl border transition-all shadow-sm active:scale-95 text-xs font-bold ${
                  usuarioAtivo === 'Luck'
                    ? 'bg-sky-50 border-sky-200 text-sky-800 hover:border-sky-300 shadow-sky-500/10'
                    : 'bg-pink-50 border-pink-200 text-pink-800 hover:border-pink-300 shadow-pink-500/10'
                }`}
              >
                <div className={`p-1.5 rounded-xl transition-colors shadow-inner ${
                  usuarioAtivo === 'Luck' ? 'bg-sky-100 text-sky-600' : 'bg-pink-100 text-pink-500'
                }`}>
                  <User size={14} className="group-hover:scale-110 transition-transform" strokeWidth={2.5} />
                </div>
                Sessão: {usuarioAtivo}
              </button>
              
            </div>

          </div>
        </header>

        {/* Corpo Principal (Com respiro perfeito para o botão flutuante no mobile) */}
        <main className="flex-1 p-4 md:p-6 space-y-6 overflow-y-auto max-w-7xl w-full mx-auto pb-36 md:pb-8">
          
          {abaAtiva === 'tarefas' && (
            <>
              {/* Card Unificado de Controles (Apenas Mobile) */}
              <section className="md:hidden flex gap-2 mb-2">
                <button 
                  onClick={() => setUsuarioAtivo(prev => prev === 'Luck' ? 'Grazy' : 'Luck')}
                  className={`flex-1 py-2.5 px-2 rounded-2xl shadow-sm flex flex-col items-center justify-center gap-1 active:scale-95 transition-all border ${
                    usuarioAtivo === 'Luck'
                      ? 'bg-sky-50 border-sky-200 text-sky-900'
                      : 'bg-pink-50 border-pink-200 text-pink-900'
                  }`}
                >
                  <div className={`p-1.5 rounded-full mb-0.5 ${
                    usuarioAtivo === 'Luck' ? 'bg-sky-100 text-sky-600' : 'bg-pink-100 text-pink-500'
                  }`}>
                    <User size={14} strokeWidth={2.5} />
                  </div>
                  <span className={`text-[9px] font-bold uppercase tracking-wider ${
                    usuarioAtivo === 'Luck' ? 'text-sky-500' : 'text-pink-400'
                  }`}>
                    Sessão Ativa
                  </span>
                  <span className="text-sm font-black">{usuarioAtivo}</span>
                </button>

                <button 
                  onClick={() => setContexto(prev => prev === 'Marketing' ? 'Prospecção' : 'Marketing')}
                  className="flex-1 bg-gradient-to-b from-blue-600 to-blue-700 border border-blue-800 py-2.5 px-2 rounded-2xl shadow-md shadow-blue-600/20 flex flex-col items-center justify-center gap-1 active:scale-95 transition-transform"
                >
                  <div className="bg-blue-500/50 p-1.5 rounded-full text-white mb-0.5">
                    <RefreshCw size={14} strokeWidth={2.5} />
                  </div>
                  <span className="text-[9px] font-bold text-blue-200 uppercase tracking-wider">Hoje é dia de</span>
                  <span className="text-sm font-black text-white">{contexto}</span>
                </button>
              </section>

              {/* KPIs de Progresso (Horizontal no Celular e no PC) */}
              <section className="grid grid-cols-3 gap-2 md:gap-4">
                
                {/* Card 1 - Progresso */}
                <div className="bg-white border border-slate-200 rounded-xl md:rounded-2xl p-2.5 md:p-4 shadow-sm flex flex-col md:flex-row items-center justify-center md:justify-between text-center md:text-left">
                  <div className="md:hidden w-7 h-7 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center mb-1.5">
                    <Award size={14} strokeWidth={2.5} />
                  </div>
                  <div className="space-y-0.5 md:space-y-1">
                    <span className="text-[8px] md:text-xs font-bold text-slate-400 uppercase tracking-wider block leading-tight">Progresso<span className="hidden md:inline"> Geral</span></span>
                    <h2 className="text-sm md:text-2xl font-black text-slate-800 tracking-tight">{porcentagemProgresso}%</h2>
                  </div>
                  <div className="hidden md:flex w-12 h-12 bg-blue-50 text-blue-600 rounded-xl items-center justify-center shadow-sm">
                    <Award size={20} />
                  </div>
                </div>

                {/* Card 2 - Pendências */}
                <div className="bg-white border border-slate-200 rounded-xl md:rounded-2xl p-2.5 md:p-4 shadow-sm flex flex-col md:flex-row items-center justify-center md:justify-between text-center md:text-left">
                  <div className="md:hidden w-7 h-7 bg-slate-50 text-slate-600 rounded-lg flex items-center justify-center mb-1.5">
                    <CheckSquare size={14} strokeWidth={2.5} />
                  </div>
                  <div className="space-y-0.5 md:space-y-1">
                    <span className="text-[8px] md:text-xs font-bold text-slate-400 uppercase tracking-wider block leading-tight truncate px-1">Pendências</span>
                    <h2 className="text-sm md:text-2xl font-black text-slate-800 tracking-tight">
                      {obterTarefasPorFiltro('minhas').filter(t => t.status !== 'concluido').length} <span className="hidden md:inline text-sm font-bold text-slate-400">tarefas</span>
                    </h2>
                  </div>
                  <div className="hidden md:flex w-12 h-12 bg-blue-50 text-blue-600 rounded-xl items-center justify-center shadow-sm">
                    <CheckSquare size={20} />
                  </div>
                </div>

                {/* Card 3 - Bloqueada */}
                <div className="bg-white border border-slate-200 rounded-xl md:rounded-2xl p-2.5 md:p-4 shadow-sm flex flex-col md:flex-row items-center justify-center md:justify-between text-center md:text-left">
                  <div className="md:hidden w-7 h-7 bg-amber-50 text-amber-600 rounded-lg flex items-center justify-center mb-1.5">
                    <Lock size={14} strokeWidth={2.5} />
                  </div>
                  <div className="space-y-0.5 md:space-y-1">
                    <span className="text-[8px] md:text-xs font-bold text-slate-400 uppercase tracking-wider block leading-tight truncate px-1">Pendentes</span>
                    <h2 className="text-sm md:text-2xl font-black text-slate-800 tracking-tight">
                      {obterTarefasPorFiltro('bloqueadas').length} <span className="hidden md:inline text-sm font-bold text-slate-400">bloq.</span>
                    </h2>
                  </div>
                  <div className="hidden md:flex w-12 h-12 bg-amber-50 text-amber-600 rounded-xl items-center justify-center shadow-sm">
                    <Lock size={20} />
                  </div>
                </div>
              </section>

              {/* Grid Lado a Lado (Desktop) */}
              <section className="hidden md:grid grid-cols-3 gap-6">
                
                {/* Minhas Tarefas */}
                <div className="bg-slate-100/50 border border-slate-200 rounded-2xl p-4 min-h-[400px] space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                    <h3 className="font-extrabold text-slate-800 flex items-center gap-2">
                      <span className="w-2.5 h-2.5 bg-blue-600 rounded-full"></span>
                      Minhas ({usuarioAtivo})
                    </h3>
                    <span className="text-xs font-bold text-slate-500 bg-slate-200 px-2 py-0.5 rounded-full">
                      {obterTarefasPorFiltro('minhas').length}
                    </span>
                  </div>
                  <div className="space-y-4">
                    {renderListaTarefas(obterTarefasPorFiltro('minhas'))}
                  </div>
                </div>

                {/* Do Sócio */}
                <div className="bg-slate-100/50 border border-slate-200 rounded-2xl p-4 min-h-[400px] space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                    <h3 className="font-extrabold text-slate-800 flex items-center gap-2">
                      <span className="w-2.5 h-2.5 bg-slate-400 rounded-full"></span>
                      Do Sócio ({usuarioAtivo === 'Luck' ? 'Grazy' : 'Luck'})
                    </h3>
                    <span className="text-xs font-bold text-slate-500 bg-slate-200 px-2 py-0.5 rounded-full">
                      {obterTarefasPorFiltro('socio').length}
                    </span>
                  </div>
                  <div className="space-y-4">
                    {renderListaTarefas(obterTarefasPorFiltro('socio'))}
                  </div>
                </div>

                {/* Bloqueadas */}
                <div className="bg-slate-100/50 border border-slate-200 rounded-2xl p-4 min-h-[400px] space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                    <h3 className="font-extrabold text-slate-800 flex items-center gap-2">
                      <span className="w-2.5 h-2.5 bg-red-500 rounded-full"></span>
                      Aguardando Liberação
                    </h3>
                    <span className="text-xs font-bold text-slate-500 bg-slate-200 px-2 py-0.5 rounded-full">
                      {obterTarefasPorFiltro('bloqueadas').length}
                    </span>
                  </div>
                  <div className="space-y-4">
                    {renderListaTarefas(obterTarefasPorFiltro('bloqueadas'))}
                  </div>
                </div>

              </section>

              {/* Abas e Listagem (Mobile) */}
              <section className="block md:hidden space-y-4">
                <div className="flex bg-white border border-slate-200 p-1 rounded-xl shadow-sm">
                  <button
                    onClick={() => setFiltroMobile('minhas')}
                    className={`flex-1 py-2 text-center rounded-lg text-xs font-bold transition ${
                      filtroMobile === 'minhas' ? 'bg-blue-600 text-white' : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    Minhas
                  </button>
                  <button
                    onClick={() => setFiltroMobile('socio')}
                    className={`flex-1 py-2 text-center rounded-lg text-xs font-bold transition ${
                      filtroMobile === 'socio' ? 'bg-blue-600 text-white' : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    Do Sócio
                  </button>
                  <button
                    onClick={() => setFiltroMobile('bloqueadas')}
                    className={`flex-1 py-2 text-center rounded-lg text-xs font-bold transition flex items-center justify-center gap-1 ${
                      filtroMobile === 'bloqueadas' ? 'bg-red-50/80 text-red-600 font-bold' : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    <Lock size={10} />
                    Bloqueadas
                  </button>
                </div>

                <div className="space-y-4">
                  {renderListaTarefas(obterTarefasPorFiltro(filtroMobile))}
                </div>
              </section>
            </>
          )}

          {abaAtiva === 'historico' && (
            <div className="space-y-6 animate-in fade-in duration-300">
              {/* Cabeçalho do Histórico */}
              <div className="flex items-center gap-3 mb-6 bg-white border border-slate-200 p-4 rounded-2xl shadow-sm">
                <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center">
                  <History size={24} />
                </div>
                <div>
                  <h2 className="text-base font-extrabold text-slate-800">Histórico de Conclusão</h2>
                  <p className="text-xs font-semibold text-slate-500">Todas as tarefas finalizadas por vocês.</p>
                </div>
              </div>

              {/* Lista de Tarefas Concluídas */}
              {tarefas.filter(t => t.status === 'concluido').length === 0 ? (
                <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm text-center py-16">
                  <History size={40} className="mx-auto text-slate-300 mb-3 opacity-50" />
                  <h3 className="font-bold text-slate-700">Nenhuma tarefa concluída ainda</h3>
                  <p className="text-sm text-slate-400 mt-1 max-w-sm mx-auto">As tarefas que você e a Grazy finalizarem aparecerão aqui.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {tarefas.filter(t => t.status === 'concluido').map(tarefa => (
                    <div key={tarefa.id} className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex items-center justify-between opacity-80 hover:opacity-100 transition">
                      <div className="flex items-center gap-3">
                        <CheckCircle2 size={24} className="text-emerald-500 shrink-0" />
                        <div>
                          <h4 className="text-sm font-bold text-slate-800 line-through">{tarefa.titulo}</h4>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-[9px] font-extrabold text-slate-500 uppercase bg-slate-100 px-2 py-0.5 rounded-md">{tarefa.nicho}</span>
                            <span className="text-[10px] font-semibold text-slate-400">Feito por: {tarefa.responsavel}</span>
                          </div>
                        </div>
                      </div>
                      
                      {/* Botão para desfazer a conclusão e voltar a tarefa para a tela inicial */}
                      <button 
                        onClick={() => handleToggleTarefaStatus(tarefa.id)}
                        className="text-[10px] font-extrabold text-slate-500 hover:text-blue-600 bg-slate-100 hover:bg-blue-50 px-2.5 py-1.5 rounded-lg transition shrink-0"
                        title="Devolver para a lista de pendências"
                      >
                        Desfazer
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {abaAtiva === 'visao_geral' && (
            <div className="space-y-6 animate-in fade-in duration-300">
              
              {/* Cabeçalho de Indicadores */}
              <div className="flex items-center gap-3 mb-6 bg-white border border-slate-200 p-4 rounded-2xl shadow-sm">
                <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center">
                  <ShieldAlert size={24} />
                </div>
                <div>
                  <h2 className="text-base font-extrabold text-slate-800">Indicadores Operacionais</h2>
                  <p className="text-xs font-semibold text-slate-500">Visão geral do volume de trabalho da EG Empório Digital.</p>
                </div>
              </div>

              {/* Cards de Métricas Gerais (Lendo TODO o banco de dados) */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm text-center">
                  <span className="text-xs font-extrabold text-slate-400 uppercase tracking-wider block mb-1">Total Criadas</span>
                  <span className="text-3xl font-black text-slate-800">{tarefas.length}</span>
                </div>
                <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-5 shadow-sm text-center">
                  <span className="text-xs font-extrabold text-emerald-600 uppercase tracking-wider block mb-1">Concluídas</span>
                  <span className="text-3xl font-black text-emerald-700">{tarefas.filter(t => t.status === 'concluido').length}</span>
                </div>
                <div className="bg-amber-50 border border-amber-100 rounded-2xl p-5 shadow-sm text-center">
                  <span className="text-xs font-extrabold text-amber-600 uppercase tracking-wider block mb-1">Bloqueadas</span>
                  <span className="text-3xl font-black text-amber-700">{tarefas.filter(t => verificarBloqueio(t)).length}</span>
                </div>
                <div className="bg-blue-50 border border-blue-100 rounded-2xl p-5 shadow-sm text-center">
                  <span className="text-xs font-extrabold text-blue-600 uppercase tracking-wider block mb-1">Pendentes</span>
                  <span className="text-3xl font-black text-blue-700">{tarefas.filter(t => t.status !== 'concluido' && !verificarBloqueio(t)).length}</span>
                </div>
              </div>

              {/* Barra de Meta Geral */}
              <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm mt-4">
                <div className="flex justify-between items-center mb-3">
                  <h3 className="text-sm font-extrabold text-slate-800">Eficiência Geral</h3>
                  <span className="text-sm font-black text-blue-600">
                    {tarefas.length > 0 ? Math.round((tarefas.filter(t => t.status === 'concluido').length / tarefas.length) * 100) : 0}%
                  </span>
                </div>
                <div className="w-full bg-slate-100 h-4 rounded-full overflow-hidden border border-slate-200/50">
                  <div 
                    className="bg-blue-600 h-full rounded-full transition-all duration-1000 ease-out relative overflow-hidden"
                    style={{ width: `${tarefas.length > 0 ? Math.round((tarefas.filter(t => t.status === 'concluido').length / tarefas.length) * 100) : 0}%` }}
                  >
                    {/* Efeito de brilho na barra */}
                    <div className="absolute top-0 left-0 bottom-0 w-full bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-100%] animate-[shimmer_2s_infinite]"></div>
                  </div>
                </div>
                <p className="text-[10px] text-slate-400 font-semibold mt-3 text-center uppercase tracking-wide">
                  Calculado com base no volume total de tarefas ativas
                </p>
              </div>

              {/* Botão de Logout exclusivo no Mobile (Bem no final da tela de Indicadores) */}
              <div className="block md:hidden pt-4 pb-8">
                <button
                  type="button"
                  onClick={() => {
                    localStorage.removeItem('eg_auth')
                    setAutenticado(false)
                    setSenhaInput('')
                  }}
                  className="w-full py-4 bg-red-50 hover:bg-red-100 border border-red-200 text-red-600 font-black rounded-2xl text-xs flex items-center justify-center gap-2 active:scale-95 transition shadow-sm"
                >
                  <LogOut size={16} strokeWidth={2.5} />
                  Trancar Painel / Sair da Sessão ({usuarioAtivo})
                </button>
              </div>

            </div>
          )}

        </main>
      </div>

      {/* Botão flutuante de Nova Tarefa */}
      <div className="fixed bottom-20 md:bottom-8 right-6 z-45">
        <button 
          className="flex items-center gap-2 px-5 py-3.5 rounded-2xl bg-blue-600 text-white font-bold shadow-lg shadow-blue-500/35 hover:bg-blue-700 active:scale-95 transition"
          onClick={() => {
            setTarefaEditandoId(null)
            setFormTitulo('')
            setFormDependencia('')
            setFormSubtarefas([])
            setNovaSubtarefa('')
            setModalAberto(true)
          }}
        >
          <Plus size={18} strokeWidth={2.5} />
          Nova Tarefa
        </button>
      </div>

      {/* MENU INFERIOR MOBILE (Mesmo Padrão Escuro do PC) */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden border-t border-slate-950 bg-slate-900 px-6 py-3 shadow-[0_-10px_30px_-10px_rgba(0,0,0,0.5)] flex items-center justify-around">
        <button 
          onClick={() => setAbaAtiva('tarefas')}
          className={`flex flex-col items-center gap-1.5 transition-all ${
            abaAtiva === 'tarefas' ? 'text-blue-400 font-bold scale-105' : 'text-slate-400 hover:text-slate-300'
          }`}
        >
          <Layers size={20} strokeWidth={abaAtiva === 'tarefas' ? 2.5 : 2} />
          <span className="text-[10px] tracking-wide">Tarefas</span>
        </button>

        <button 
          onClick={() => setAbaAtiva('historico')}
          className={`flex flex-col items-center gap-1.5 transition-all ${
            abaAtiva === 'historico' ? 'text-blue-400 font-bold scale-105' : 'text-slate-400 hover:text-slate-300'
          }`}
        >
          <History size={20} strokeWidth={abaAtiva === 'historico' ? 2.5 : 2} />
          <span className="text-[10px] tracking-wide">Histórico</span>
        </button>

        <button 
          onClick={() => setAbaAtiva('visao_geral')}
          className={`flex flex-col items-center gap-1.5 transition-all ${
            abaAtiva === 'visao_geral' ? 'text-blue-400 font-bold scale-105' : 'text-slate-400 hover:text-slate-300'
          }`}
        >
          <ShieldAlert size={20} strokeWidth={abaAtiva === 'visao_geral' ? 2.5 : 2} />
          <span className="text-[10px] tracking-wide">Indicadores</span>
        </button>
      </nav>

    {/* ------------------------------------------------------------------ */}
    {/* MODAL DE CRIAÇÃO DE TAREFA (Scroll Interno Garantido) */}
    {/* ------------------------------------------------------------------ */}
    {modalAberto && (
      <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
        <div className="bg-white rounded-3xl border border-slate-200 w-full max-w-md p-5 md:p-6 shadow-xl animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto overscroll-contain">
          <div className="flex justify-between items-center mb-5">
            <h3 className="text-base font-extrabold text-slate-800">
              {tarefaEditandoId ? 'Editar Tarefa' : 'Nova Tarefa'}
            </h3>
            <button 
              onClick={() => {
                setModalAberto(false)
                setTarefaEditandoId(null)
              }}
              className="text-xs font-bold text-slate-400 hover:text-slate-600 px-2 py-1 rounded-lg hover:bg-slate-100"
            >
              Fechar
            </button>
          </div>

          <form onSubmit={handleSalvarTarefa} className="space-y-4">
            {/* Título */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 uppercase">O que precisa ser feito?</label>
              <input 
                type="text" 
                value={formTitulo}
                onChange={(e) => setFormTitulo(e.target.value)}
                placeholder="Ex: Gravar reels de Barbearia..."
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-500 font-medium"
                required
              />
            </div>

            {/* Responsável e Prioridade */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase">Responsável</label>
                <select 
                  value={formResponsavel}
                  onChange={(e) => setFormResponsavel(e.target.value as any)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-bold focus:outline-none"
                >
                  <option value="Luck">Luck</option>
                  <option value="Grazy">Grazy</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase">Prioridade</label>
                <select 
                  value={formPrioridade}
                  onChange={(e) => setFormPrioridade(e.target.value as any)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-bold focus:outline-none"
                >
                  <option value="baixa">Baixa</option>
                  <option value="media">Média</option>
                  <option value="alta">Alta</option>
                </select>
              </div>
            </div>

            {/* Contexto da Atividade */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 uppercase">Contexto de Exibição (Dia)</label>
              <select 
                value={formContexto}
                onChange={(e) => setFormContexto(e.target.value as any)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-bold focus:outline-none"
              >
                <option value="Marketing">Marketing</option>
                <option value="Prospecção">Prospecção</option>
              </select>
            </div>

            {/* Categoria/Setor Real da Empresa */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 uppercase">Serviço / Setor</label>
              <select 
                value={formNicho}
                onChange={(e) => setFormNicho(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-bold focus:outline-none"
              >
                <option value="Criação de Sites">Criação de Sites</option>
                <option value="Criação de Automação">Criação de Automação</option>
                <option value="Gestão de Tráfego">Gestão de Tráfego</option>
                <option value="Otimização SEO">Otimização SEO</option>
                <option value="Vídeos para Canais">Vídeos para Canais (Youtube/TikTok)</option>
                <option value="Imagens para Marketing">Imagens para Marketing</option>
                <option value="Vídeos para Marketing">Vídeos para Marketing</option>
              </select>
            </div>

            {/* Dependência (O Cadeado) */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 uppercase">Depende de outra tarefa?</label>
              <select 
                value={formDependencia}
                onChange={(e) => setFormDependencia(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-bold focus:outline-none"
              >
                <option value="">Não (Livre para executar)</option>
                {/* Mostra apenas tarefas que ainda não estão concluídas para você vincular */}
                {tarefas.filter(t => t.status !== 'concluido' && t.contexto === formContexto).map(t => (
                  <option key={t.id} value={t.id}>
                    {t.titulo} (de {t.responsavel})
                  </option>
                ))}
              </select>
            </div>

            {/* Checklist / Etapas */}
            <div className="space-y-2 border-t border-slate-200 pt-4 mt-2">
              <label className="text-xs font-bold text-slate-500 uppercase">Etapas (Checklist)</label>
              
              {formSubtarefas.length > 0 && (
                <div className="space-y-1 mb-2">
                  {formSubtarefas.map((sub, idx) => (
                    <div key={idx} className="flex justify-between items-center bg-slate-100 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-700">
                      <span>{sub}</span>
                      <button type="button" onClick={() => setFormSubtarefas(prev => prev.filter((_, i) => i !== idx))} className="text-slate-400 hover:text-red-500">
                        <X size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex gap-2">
                <input 
                  type="text" 
                  value={novaSubtarefa}
                  onChange={(e) => setNovaSubtarefa(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      if(novaSubtarefa.trim()) {
                        setFormSubtarefas(prev => [...prev, novaSubtarefa])
                        setNovaSubtarefa('')
                      }
                    }
                  }}
                  placeholder="Ex: Editar reels, Fazer thumb..."
                  className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-blue-500"
                />
                <button 
                  type="button"
                  onClick={() => {
                    if(novaSubtarefa.trim()) {
                      setFormSubtarefas(prev => [...prev, novaSubtarefa])
                      setNovaSubtarefa('')
                    }
                  }}
                  className="bg-blue-100 text-blue-700 px-3 rounded-xl text-xs font-bold hover:bg-blue-200"
                >
                  Adicionar
                </button>
              </div>
            </div>

            {/* Recorrência */}
            <div className="flex items-center gap-2 py-2 pt-4 select-none cursor-pointer" onClick={() => setFormRecorrente(!formRecorrente)}>
              <input 
                type="checkbox" 
                checked={formRecorrente}
                onChange={() => {}} // controlado pelo div pai
                className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 w-4 h-4"
              />
              <span className="text-xs font-bold text-slate-600">Tarefa Recorrente Semanal</span>
            </div>

            {/* Botão de Salvar */}
            <button 
              type="submit" 
              className="w-full py-3 bg-blue-600 text-white font-bold rounded-xl text-xs hover:bg-blue-700 transition shadow-lg shadow-blue-500/10"
            >
              Criar Tarefa no Banco
            </button>
          </form>
        </div>
      </div>
    )}
    {/* ------------------------------------------------------------------ */}
    {/* MODAL DE CONFIRMAÇÃO PREMIUM (Exclusão e Conclusão) */}
    {/* ------------------------------------------------------------------ */}
    {modalConfirmacao.aberto && (
      <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
        <div className="bg-white rounded-3xl border border-slate-200 w-full max-w-sm p-6 shadow-2xl animate-in zoom-in-95 duration-200">
          <div className="flex flex-col items-center text-center">
            
            {/* Ícone Dinâmico */}
            <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-4 shadow-inner ${
              modalConfirmacao.tipo === 'excluir' 
                ? 'bg-red-50 text-red-500 border border-red-100' 
                : 'bg-emerald-50 text-emerald-500 border border-emerald-100'
            }`}>
              {modalConfirmacao.tipo === 'excluir' ? <Trash2 size={32} strokeWidth={2} /> : <CheckCircle2 size={32} strokeWidth={2} />}
            </div>

            {/* Título Dinâmico */}
            <h3 className="text-lg font-black text-slate-800 tracking-tight mb-1">
              {modalConfirmacao.tipo === 'excluir' ? 'Excluir Tarefa?' : 'Concluir Tarefa?'}
            </h3>
            
            {/* Texto Dinâmico */}
            <p className="text-sm font-semibold text-slate-500 mb-6 px-2">
              {modalConfirmacao.tipo === 'excluir' 
                ? 'Esta ação é irreversível. A tarefa será apagada permanentemente do sistema.' 
                : 'Você finalizou e conferiu todos os passos necessários desta demanda?'}
            </p>

            {/* Botões de Ação */}
            <div className="flex gap-3 w-full">
              <button 
                onClick={() => setModalConfirmacao({ aberto: false, tipo: null, tarefaId: '' })}
                className="flex-1 py-3 bg-slate-100 text-slate-600 font-bold rounded-xl text-sm hover:bg-slate-200 transition active:scale-95"
              >
                Cancelar
              </button>
              
              <button 
                onClick={() => {
                  // Aqui chamamos as suas funções originais intactas!
                  if (modalConfirmacao.tipo === 'excluir') {
                    handleExcluirTarefa(modalConfirmacao.tarefaId)
                  } else {
                    handleToggleTarefaStatus(modalConfirmacao.tarefaId)
                  }
                  setModalConfirmacao({ aberto: false, tipo: null, tarefaId: '' })
                }}
                className={`flex-1 py-3 font-bold rounded-xl text-sm transition shadow-lg active:scale-95 text-white ${
                  modalConfirmacao.tipo === 'excluir'
                    ? 'bg-red-500 hover:bg-red-600 shadow-red-500/25'
                    : 'bg-emerald-500 hover:bg-emerald-600 shadow-emerald-500/25'
                }`}
              >
                Sim, {modalConfirmacao.tipo === 'excluir' ? 'Excluir' : 'Concluir'}
              </button>
            </div>

          </div>
        </div>
      </div>
    )}

    {/* ------------------------------------------------------------------ */}
    {/* MODAL DESLIZANTE ESTILO iOS (Específico para Vídeos de Canais) */}
    {/* ------------------------------------------------------------------ */}
    {modalRemessasAberto && tarefaSelecionadaRemessas && (
      <div className="fixed inset-0 z-[65] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-3 md:p-6 animate-in fade-in duration-200">
        <div className="bg-white border border-slate-200 text-slate-800 rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[88vh] animate-in zoom-in-95 duration-200">
          
          {/* Top Bar Estilo iOS */}
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/80 backdrop-blur">
            <div className="flex items-center gap-2">
              {canalSelecionado ? (
                <button 
                  onClick={() => setCanalSelecionado(null)}
                  className="flex items-center gap-1 text-xs font-black text-blue-600 hover:text-blue-700 transition py-1 pr-2"
                >
                  ‹ Contas
                </button>
              ) : (
                <span className="text-[10px] uppercase font-black tracking-widest text-slate-400">
                  {tarefaSelecionadaRemessas.titulo}
                </span>
              )}
            </div>

            <h3 className="text-sm font-black text-slate-800 truncate max-w-[200px] text-center">
              {canalSelecionado ? canalSelecionado.titulo : 'Canais Cadastrados'}
            </h3>

            {/* BOTÃO CONCLUÍDO RÁPIDO (Salva e Fecha Instantaneamente) */}
            <button
              onClick={() => {
                setModalRemessasAberto(false)
                setCanalSelecionado(null)
                setTarefaSelecionadaRemessas(null)
              }}
              className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs px-3.5 py-1.5 rounded-xl shadow-md shadow-emerald-500/20 active:scale-95 transition"
            >
              Concluído
            </button>
          </div>

          {/* Área com Transição Deslizante Estilo iOS */}
          <div className="flex-1 overflow-y-auto p-4 md:p-5">
            {!canalSelecionado ? (
              // NÍVEL 1: LISTA DE CONTAS / CANAIS
              <div className="space-y-2.5 animate-in slide-in-from-left duration-200">
                <div className="mb-2 px-1">
                  <p className="text-xs font-bold text-slate-500">Toque em um canal para registrar as postagens:</p>
                </div>

                {tarefaSelecionadaRemessas.subtarefas?.length === 0 ? (
                  <div className="text-center py-10 text-slate-400 text-xs font-medium">
                    Nenhum canal cadastrado nesta tarefa.
                  </div>
                ) : (
                  tarefaSelecionadaRemessas.subtarefas.map((sub: any) => {
                    const totalSlots = sub.remessas_total || 5
                    const concluidos = (sub.remessas_feitas || []).length
                    const pct = Math.round((concluidos / totalSlots) * 100)

                    return (
                      <div
                        key={sub.id}
                        onClick={() => setCanalSelecionado(sub)}
                        className="w-full flex items-center justify-between p-3.5 bg-slate-50 hover:bg-blue-50/50 border border-slate-200 hover:border-blue-200 rounded-2xl cursor-pointer active:scale-[0.99] transition group"
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-3 h-3 rounded-full ${concluidos >= totalSlots ? 'bg-emerald-500' : concluidos > 0 ? 'bg-blue-500' : 'bg-slate-300'}`}></div>
                          <div className="text-left">
                            <span className="text-sm font-bold text-slate-700 group-hover:text-blue-900 transition">
                              {sub.titulo}
                            </span>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="text-[10px] font-semibold text-slate-400">
                                {concluidos} de {totalSlots} vídeos postados
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 text-slate-400 group-hover:text-blue-600 font-bold text-xs">
                          <span>{pct}%</span>
                          <span className="text-base leading-none">›</span>
                        </div>
                      </div>
                    )
                  })
                )}
              </div>
            ) : (
              // NÍVEL 2: AS REMESSAS DO CANAL ESCOLHIDO
              <div className="space-y-4 animate-in slide-in-from-right duration-200">
                <div className="bg-slate-50 border border-slate-200 p-3.5 rounded-2xl flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-wider text-blue-600 block">Canal Ativo</span>
                    <h4 className="text-sm font-black text-slate-800">{canalSelecionado.titulo}</h4>
                  </div>
                  <span className="text-xs font-black bg-blue-100 text-blue-700 px-2.5 py-1 rounded-xl">
                    {(canalSelecionado.remessas_feitas || []).length} de {canalSelecionado.remessas_total || 5} Feitos
                  </span>
                </div>

                <div className="space-y-2">
                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-1">Remessas de Vídeo:</p>
                  
                  {Array.from({ length: canalSelecionado.remessas_total || 5 }).map((_, index) => {
                    const numeroRemessa = index + 1
                    const estaFeita = (canalSelecionado.remessas_feitas || []).includes(numeroRemessa)

                    return (
                      <button
                        key={numeroRemessa}
                        type="button"
                        onClick={() => handleToggleRemessa(canalSelecionado.id, numeroRemessa)}
                        className={`w-full flex items-center justify-between p-3.5 rounded-2xl border transition active:scale-[0.98] ${
                          estaFeita
                            ? 'bg-emerald-50/70 border-emerald-300 text-emerald-800'
                            : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-7 h-7 rounded-xl flex items-center justify-center font-black text-xs ${
                            estaFeita ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-slate-600'
                          }`}>
                            {numeroRemessa}
                          </div>
                          <span className={`text-xs font-bold ${estaFeita ? 'line-through text-slate-400' : 'text-slate-700'}`}>
                            Remessa {numeroRemessa} (Vídeo {numeroRemessa})
                          </span>
                        </div>

                        {estaFeita ? (
                          <CheckCircle2 size={18} className="text-emerald-600" />
                        ) : (
                          <Circle size={18} className="text-slate-300" />
                        )}
                      </button>
                    )
                  })}
                </div>
              </div>
            )}
          </div>

        </div>
      </div>
    )}
    </div>
  )

  // Função auxiliar para renderizar a lista de tarefas
  function renderListaTarefas(lista: any[]) {
    if (lista.length === 0) {
      return (
        <div className="text-center py-12 border border-dashed border-slate-200 rounded-2xl bg-white/50">
          <p className="text-xs text-slate-400 font-medium">Nenhuma tarefa encontrada.</p>
        </div>
      )
    }

    return lista.map(tarefa => {
      const estaBloqueada = verificarBloqueio(tarefa)
      const sendoArrastada = tarefaArrastadaId === tarefa.id

      return (
        <div 
          key={tarefa.id}
          data-tarefa-id={tarefa.id}
          // Eventos para Desktop (Mouse)
          onMouseDown={() => !estaBloqueada && iniciarPress(tarefa.id)}
          onMouseUp={finalizarArraste}
          onMouseLeave={cancelarPress}
          onMouseEnter={() => {
            if (tarefaArrastadaId && tarefaArrastadaId !== tarefa.id) {
              moverTarefaParaPosicao(tarefa.id)
            }
          }}
          // Eventos para Celular / Mobile (Touch)
          onTouchStart={() => !estaBloqueada && iniciarPress(tarefa.id)}
          onTouchMove={handleTouchMove}
          onTouchEnd={finalizarArraste}
          onTouchCancel={cancelarPress}
          style={{ touchAction: modoOrdenacaoAtivo ? 'none' : 'auto' }}
          className={`bg-white border rounded-2xl p-4 transition-all duration-200 select-none ${
            sendoArrastada
              ? 'ring-2 ring-blue-500 shadow-2xl scale-[1.04] z-30 opacity-95 border-blue-400 bg-blue-50/40'
              : modoOrdenacaoAtivo
              ? 'opacity-70 border-slate-300'
              : estaBloqueada 
              ? 'border-red-100 bg-red-50/20 opacity-70' 
              : tarefa.status === 'concluido'
              ? 'border-slate-100 opacity-60 bg-slate-50/40'
              : 'border-slate-200 hover:border-slate-300 shadow-sm'
          }`}
        >
          <div className="flex justify-between items-center mb-2.5">
            <div className="flex items-center gap-1.5">
              <span className="flex items-center gap-1 text-[10px] uppercase tracking-wider font-extrabold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-lg border border-blue-100/40">
                <Folder size={10} /> {tarefa.nicho}
              </span>
              
              {/* Tag de Prioridade com Cores Suaves */}
              <span className={`text-[9px] uppercase tracking-wider font-extrabold px-2 py-0.5 rounded-lg border ${
                tarefa.prioridade === 'alta'
                  ? 'bg-rose-50 border-rose-200 text-rose-700'
                  : tarefa.prioridade === 'media'
                  ? 'bg-amber-50 border-amber-200 text-amber-700'
                  : 'bg-slate-50 border-slate-200 text-slate-600'
              }`}>
                {tarefa.prioridade || 'baixa'}
              </span>
            </div>

            {tarefa.recorrente && (
              <span className="text-[9px] text-slate-500 font-bold flex items-center gap-1 bg-slate-100 px-2 py-0.5 rounded-lg border border-slate-200/50">
                <Calendar size={8} /> Recorrente
              </span>
            )}
          </div>

          <div className="flex items-start justify-between gap-3">
            {/* Título Clicável Padronizado: Sempre abre para editar a tarefa */}
            <div className="space-y-0.5 flex-1 pr-2">
              <h4 
                onClick={() => handleAbrirEdicao(tarefa)}
                className={`text-sm font-bold tracking-tight cursor-pointer transition hover:text-blue-600 active:scale-[0.99] select-none ${
                  tarefa.status === 'concluido' 
                    ? 'line-through text-slate-400' 
                    : 'text-slate-800'
                }`}
                title="Clique para editar a tarefa"
              >
                {tarefa.titulo}
              </h4>
              <p className="text-[11px] text-slate-400 font-semibold">Responsável: {tarefa.responsavel}</p>
            </div>

            {/* Ações Direitas (Lixeira e Concluir) */}
            <div className="flex items-center gap-3 shrink-0">
              <button 
                onClick={() => setModalConfirmacao({ aberto: true, tipo: 'excluir', tarefaId: tarefa.id })}
                className="text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition p-1.5 active:scale-95"
                title="Excluir tarefa"
              >
                <Trash2 size={16} />
              </button>

              <button 
                onClick={() => {
                  if (!estaBloqueada) {
                    if (tarefa.status !== 'concluido') {
                      setModalConfirmacao({ aberto: true, tipo: 'concluir', tarefaId: tarefa.id })
                    } else {
                      handleToggleTarefaStatus(tarefa.id)
                    }
                  }
                }}
                disabled={estaBloqueada}
                className="text-slate-400 hover:text-blue-600 transition"
              >
                {estaBloqueada ? (
                  <div className="flex items-center gap-1 bg-red-50 border border-red-100 px-2 py-1 rounded-lg text-red-600 text-[9px] font-extrabold uppercase tracking-wider">
                    <Lock size={10} /> Bloqueado
                  </div>
                ) : tarefa.status === 'concluido' ? (
                  <CheckCircle2 size={22} className="text-emerald-500" />
                ) : (
                  <Circle size={22} className="text-slate-300 hover:text-blue-500" />
                )}
              </button>
            </div>
          </div>

          {/* Subtarefas / Checklist Inteligente */}
          {tarefa.subtarefas && tarefa.subtarefas.length > 0 && (
            <div className="mt-4 pt-3 border-t border-slate-100 space-y-1.5">
              
              {/* Cabeçalho do Checklist */}
              <div className="flex justify-between text-[9px] text-slate-400 font-bold uppercase tracking-wider mb-2">
                <span>{tarefa.nicho === 'Vídeos para Canais' ? 'Canais Cadastrados' : 'Checklist'}</span>
                <span>
                  {tarefa.nicho === 'Vídeos para Canais' 
                    ? `${tarefa.subtarefas.length} canais`
                    : `${tarefa.subtarefas.filter((s:any) => s.concluida).length}/${tarefa.subtarefas.length}`}
                </span>
              </div>
              
              {/* SE FOR VÍDEOS PARA CANAIS: Mostra os canais e o resumo de vídeos, abrindo a subjanela */}
              {tarefa.nicho === 'Vídeos para Canais' ? (
                tarefa.subtarefas.map((sub: any) => {
                  const feitas = (sub.remessas_feitas || []).length
                  const total = sub.remessas_total || 5
                  const tudoFeito = feitas >= total

                  return (
                    <div 
                      key={sub.id}
                      onClick={() => {
                        if (!estaBloqueada) {
                          setTarefaSelecionadaRemessas(tarefa)
                          setCanalSelecionado(sub)
                          setModalRemessasAberto(true)
                        }
                      }}
                      className="flex items-center justify-between p-2 rounded-xl text-xs cursor-pointer select-none bg-slate-50/80 hover:bg-blue-50/60 border border-slate-100 hover:border-blue-200 transition group"
                    >
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${tudoFeito ? 'bg-emerald-500' : feitas > 0 ? 'bg-blue-500' : 'bg-slate-300'}`}></div>
                        <span className="font-semibold text-slate-700 group-hover:text-blue-900">{sub.titulo}</span>
                      </div>
                      <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-lg border ${
                        tudoFeito
                          ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                          : feitas > 0
                          ? 'bg-blue-50 border-blue-200 text-blue-700'
                          : 'bg-white border-slate-200 text-slate-500'
                      }`}>
                        {feitas}/{total} vídeos
                      </span>
                    </div>
                  )
                })
              ) : (
                /* DEMAIS NICHOS (Automação, Sites, etc.): O checklist tradicional simples que você marca e risca */
                tarefa.subtarefas.map((sub: any) => (
                  <div 
                    key={sub.id}
                    onClick={() => !estaBloqueada && handleToggleSubtarefa(sub.id, sub.concluida)}
                    className={`flex items-start gap-2 p-1.5 rounded-lg text-xs cursor-pointer select-none transition ${
                      sub.concluida ? 'text-slate-400 bg-slate-50' : 'text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    {sub.concluida ? (
                      <CheckCircle2 size={14} className="text-emerald-500 shrink-0 mt-0.5" />
                    ) : (
                      <Circle size={14} className="text-slate-300 shrink-0 mt-0.5" />
                    )}
                    <span className={sub.concluida ? 'line-through' : 'font-medium leading-tight'}>
                      {sub.titulo}
                    </span>
                  </div>
                ))
              )}

            </div>
          )}
        </div>
      )
    })
  }
}
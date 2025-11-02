import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
    flowType: 'pkce'
  },
  global: {
    headers: {
      'X-Client-Info': 'cliged-expense@1.0.0'
    }
  },
  db: {
    schema: 'public'
  }
})

// Helper functions for database operations
export const db = {
  // App users table operations (perfis de usuário)
  appUsers: {
    async create(userData) {
      const { data, error } = await supabase
        .from('app_users')
        .insert([{
          ...userData,
          created_at: new Date().toISOString()
        }])
        .select()
        .single()
      
      if (error) throw error
      return data
    },

    async getById(id) {
      const { data, error } = await supabase
        .from('app_users')
        .select('*')
        .eq('id', id)
        .single()
      
      if (error && error.code !== 'PGRST116') throw error
      return data
    },

    async getByEmail(email) {
      const { data, error } = await supabase
        .from('app_users')
        .select('*')
        .eq('email', email)
        .single()
      
      if (error && error.code !== 'PGRST116') throw error
      return data
    },

    async getAll() {
      const { data, error } = await supabase
        .from('app_users')
        .select('*')
        .order('name')
      
      if (error) throw error
      return data || []
    },

    async update(id, updates) {
      const { data, error } = await supabase
        .from('app_users')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single()
      
      if (error) throw error
      return data
    }
  },

  // Users table operations (autenticação)
  users: {
    async create(userData) {
      const { data, error } = await supabase
        .from('users')
        .insert([{
          ...userData,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          is_active: true,
          failed_login_attempts: 0
        }])
        .select()
        .single()
      
      if (error) throw error
      return data
    },

    async getByEmail(email) {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('email', email)
        .eq('is_active', true)
        .single()
      
      if (error && error.code !== 'PGRST116') throw error
      return data
    },

    async getByUsername(username) {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('username', username)
        .eq('is_active', true)
        .single()
      
      if (error && error.code !== 'PGRST116') throw error
      return data
    },

    async updateLastLogin(id) {
      const { data, error } = await supabase
        .from('users')
        .update({
          last_login: new Date().toISOString(),
          failed_login_attempts: 0,
          locked_until: null,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single()
      
      if (error) throw error
      return data
    }
  },

  // Categories table operations
  categories: {
    async getAll() {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('name')
      
      if (error) throw error
      return data || []
    },

    async getById(id) {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .eq('id', id)
        .single()
      
      if (error) throw error
      return data
    },

    async create(categoryData) {
      const { data, error } = await supabase
        .from('categories')
        .insert([{
          ...categoryData,
          created_at: new Date().toISOString()
        }])
        .select()
        .single()
      
      if (error) throw error
      return data
    }
  },

  // Expense reports table operations
  expenseReports: {
    async create(reportData) {
      const { data, error } = await supabase
        .from('expense_reports')
        .insert([{
          ...reportData,
          created_at: new Date().toISOString()
        }])
        .select()
        .single()
      
      if (error) throw error
      return data
    },

    async getByUserId(userId) {
      const { data, error } = await supabase
        .from('expense_reports')
        .select(`
          *,
          expense_items (*)
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
      
      if (error) throw error
      return data || []
    },

    async getAll() {
      const { data, error } = await supabase
        .from('expense_reports')
        .select(`
          *,
          expense_items (*)
        `)
        .order('created_at', { ascending: false })
      
      if (error) throw error
      return data || []
    },

    async getById(id) {
      const { data, error } = await supabase
        .from('expense_reports')
        .select(`
          *,
          expense_items (*)
        `)
        .eq('id', id)
        .single()
      
      if (error) throw error
      return data
    },

    async update(id, updates) {
      const { data, error } = await supabase
        .from('expense_reports')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single()
      
      if (error) throw error
      return data
    },

    async delete(id) {
      const { error } = await supabase
        .from('expense_reports')
        .delete()
        .eq('id', id)
      
      if (error) throw error
    }
  },

  // Expenses table operations (itens de despesa)
  expenses: {
    async create(expenseData) {
      const { data, error } = await supabase
        .from('expense_items')
        .insert([{
          ...expenseData,
          created_at: new Date().toISOString()
        }])
        .select()
        .single()
      
      if (error) throw error
      return data
    },

    async getByReportId(reportId) {
      const { data, error } = await supabase
        .from('expense_items')
        .select('*')
        .eq('expense_report_id', reportId)
        .order('created_at', { ascending: true })
      
      if (error) throw error
      return data || []
    },

    async update(id, userData) {
    const { data, error } = await supabase
      .from('users')
      .update({
        ...userData,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  async getByEmail(email) {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single()
    
    if (error && error.code !== 'PGRST116') throw error
    return data
  },

  async updateLastLogin(id) {
    const { data, error } = await supabase
      .from('users')
      .update({
        last_login: new Date().toISOString(),
        failed_login_attempts: 0,
        locked_until: null,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single()
    
    if (error) throw error
    return data
  },

    async delete(id) {
      const { error } = await supabase
        .from('expense_items')
        .delete()
        .eq('id', id)
      
      if (error) throw error
    },

    async deleteByReportId(reportId) {
      const { error } = await supabase
        .from('expense_items')
        .delete()
        .eq('expense_report_id', reportId)
      
      if (error) throw error
    }
  }
}

// Storage operations for receipts
export const storage = {
  async uploadReceipt(file, fileName) {
    const { data, error } = await supabase.storage
      .from('receipts')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false
      })
    
    if (error) throw error
    return data
  },

  async getReceiptUrl(fileName) {
    const { data } = supabase.storage
      .from('receipts')
      .getPublicUrl(fileName)
    
    return data.publicUrl
  },

  async deleteReceipt(fileName) {
    const { error } = await supabase.storage
      .from('receipts')
      .remove([fileName])
    
    if (error) throw error
  }
}

// Auth operations (autenticação customizada)
// CORRIGIR: auth.signUp para usar Supabase Auth nativo
export const auth = {
  async signUp(email, password, userData = {}) {
    try {
      // 1. Criar usuário no Supabase Auth (auth.users)
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: email.trim(),
        password: password,
        options: {
          data: {
            username: userData.username || email.split('@')[0],
            role: userData.role || 'USER',
            unit: userData.unit || null
          }
        }
      })

      if (authError) {
        throw new Error(authError.message)
      }

      if (!authData.user) {
        throw new Error('Erro ao criar usuário')
      }

      // 2. Criar perfil complementar na tabela app_users (após auth funcionar)
      if (authData.user) {
        try {
          const profile = await db.appUsers.create({
            id: authData.user.id, // Usar o ID do auth.users
            email: authData.user.email,
            name: userData.name || userData.username || email.split('@')[0],
            role: userData.role || 'USER',
            unit: userData.unit || null
          })

          return { 
            user: {
              ...authData.user,
              profile: profile
            }, 
            error: null 
          }
        } catch (profileError) {
          console.warn('Erro ao criar perfil:', profileError)
          // Usuário foi criado no auth, mas perfil falhou
          return { user: authData.user, error: null }
        }
      }

      return { user: authData.user, error: null }
    } catch (error) {
      console.error('Erro no signUp:', error)
      return { user: null, error }
    }
  },

  async signIn(email, password) {
    try {
      console.log('Tentando login com:', email)
      
      // Usar APENAS o sistema de autenticação nativo do Supabase
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: password
      })
      
      console.log('Resposta do Supabase Auth:', { authData, authError })
      
      if (authError) {
        console.error('Erro de autenticação:', authError)
        
        // Mapear erros para mensagens amigáveis
        if (authError.message.includes('Invalid login credentials')) {
          throw new Error('E-mail ou senha incorretos')
        } else if (authError.message.includes('Email not confirmed')) {
          throw new Error('E-mail não confirmado. Verifique sua caixa de entrada.')
        } else if (authError.message.includes('Too many requests')) {
          throw new Error('Muitas tentativas. Tente novamente em alguns minutos.')
        }
        
        throw new Error(authError.message)
      }
      
      if (!authData.user) {
        throw new Error('Falha na autenticação')
      }
      
      console.log('Login bem-sucedido para:', authData.user.email)
      
      // Buscar perfil complementar (opcional)
      let profile = null
      try {
        profile = await db.appUsers.getById(authData.user.id)
      } catch (profileError) {
        console.warn('Perfil não encontrado, mas login OK:', profileError)
      }
      
      const userData = {
        id: authData.user.id,
        email: authData.user.email,
        username: authData.user.user_metadata?.username || authData.user.email.split('@')[0],
        role: authData.user.user_metadata?.role || 'USER',
        profile: profile
      }
      
      return { user: userData, error: null }
      
    } catch (error) {
      console.error('Erro no signIn:', error)
      return { user: null, error }
    }
  },

  async signOut() {
    try {
      const { error } = await supabase.auth.signOut()
      if (error) throw error
      return { error: null }
    } catch (error) {
      return { error }
    }
  },

  getCurrentUser() {
    return supabase.auth.getUser()
  },

  getCurrentSession() {
    return supabase.auth.getSession()
  },

  onAuthStateChange(callback) {
    return supabase.auth.onAuthStateChange(callback)
  }
}

// Funções de upload de recibos
export const receiptStorage = {
  async uploadReceipt(file, expenseReportId) {
    try {
      // Validar tipo de arquivo
      const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
      if (!allowedTypes.includes(file.type)) {
        throw new Error('Tipo de arquivo não permitido. Use JPEG, PNG, WebP ou PDF.')
      }

      // Validar tamanho (5MB)
      if (file.size > 5 * 1024 * 1024) {
        throw new Error('Arquivo muito grande. Tamanho máximo: 5MB.')
      }

      // Gerar nome único para o arquivo
      const fileExt = file.name.split('.').pop()
      const fileName = `${expenseReportId}_${Date.now()}.${fileExt}`
      const filePath = `receipts/${fileName}`

      // Upload do arquivo
      const { data, error } = await supabase.storage
        .from('receipts')
        .upload(filePath, file)

      if (error) {
        throw error
      }

      // Obter URL pública do arquivo
      const { data: urlData } = supabase.storage
        .from('receipts')
        .getPublicUrl(filePath)

      return {
        success: true,
        filePath: data.path,
        publicUrl: urlData.publicUrl,
        fileName: fileName
      }
    } catch (error) {
      console.error('Erro no upload do recibo:', error)
      return {
        success: false,
        error: error.message
      }
    }
  },

  async deleteReceipt(filePath) {
    try {
      const { error } = await supabase.storage
        .from('receipts')
        .remove([filePath])

      if (error) {
        throw error
      }

      return { success: true }
    } catch (error) {
      console.error('Erro ao deletar recibo:', error)
      return {
        success: false,
        error: error.message
      }
    }
  },

  async getReceiptUrl(filePath) {
    try {
      const { data } = supabase.storage
        .from('receipts')
        .getPublicUrl(filePath)

      return data.publicUrl
    } catch (error) {
      console.error('Erro ao obter URL do recibo:', error)
      return null
    }
  }
}

// Exportações individuais para facilitar o uso
export const uploadReceipt = receiptStorage.uploadReceipt
export const deleteReceipt = receiptStorage.deleteReceipt
export const getReceiptUrl = receiptStorage.getReceiptUrl
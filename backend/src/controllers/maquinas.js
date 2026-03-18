const supabase = require('../config/supabase');
const { getHttpStatus } = require('../utils/httpError');

const getById = async (req, res) => {
  const { id } = req.params;

  const { data, error } = await supabase
    .from('maquinas')
    .select('*')
    .eq('id', id)
    .single();

  if (error) return res.status(getHttpStatus(error)).json({ error: error.message });
  if (!data) return res.status(404).json({ error: 'Máquina no encontrada' });
  res.json(data);
};

const getAll = async (req, res) => {
  const { data, error } = await supabase
    .from('maquinas')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) return res.status(getHttpStatus(error)).json({ error: error.message });
  res.json(data);
};

const create = async (req, res) => {
  const { nombre, descripcion, codigo, ubicacion, imagen_url, estado, fecha_ultima_inspeccion } = req.body;

  const missing = [];
  if (!nombre || !nombre.trim()) missing.push('nombre');
  if (!codigo || !codigo.trim()) missing.push('código');

  if (missing.length > 0) {
    return res.status(400).json({ error: `Campos requeridos: ${missing.join(', ')}` });
  }

  const { data, error } = await supabase
    .from('maquinas')
    .insert({ nombre: nombre.trim(), descripcion, codigo: codigo.trim(), ubicacion, imagen_url, estado, fecha_ultima_inspeccion })
    .select()
    .single();

  if (error) return res.status(getHttpStatus(error)).json({ error: error.message });
  res.status(201).json(data);
};

const remove = async (req, res) => {
  const { id } = req.params;
  const cascade = req.query.cascade === 'true';

  // Verificar si tiene mantenimientos asociados
  const { data: mants, error: countError } = await supabase
    .from('mantenimientos')
    .select('id', { count: 'exact' })
    .eq('maquina_id', id);

  if (countError) return res.status(getHttpStatus(countError)).json({ error: countError.message });

  if (mants && mants.length > 0) {
    if (!cascade) {
      return res.status(409).json({
        error: `Esta máquina tiene ${mants.length} mantenimiento(s) asociado(s).`,
        count: mants.length,
      });
    }

    // Cascade: borrar repuestos de cada mantenimiento, luego los mantenimientos, luego la máquina.
    // NOTE: This is not atomic. If a middle step fails, data may be partially deleted.
    // Ideally this would use a Supabase RPC / database function for transactional safety.
    const mantIds = mants.map(m => m.id);

    const { error: repError } = await supabase
      .from('repuestos')
      .delete()
      .in('mantenimiento_id', mantIds);

    if (repError) return res.status(getHttpStatus(repError)).json({ error: repError.message });

    const { error: mantError } = await supabase
      .from('mantenimientos')
      .delete()
      .eq('maquina_id', id);

    if (mantError) return res.status(500).json({
      error: 'Eliminación parcial: los repuestos fueron eliminados pero los mantenimientos no. Contacte al administrador.',
    });
  }

  const { error } = await supabase
    .from('maquinas')
    .delete()
    .eq('id', id);

  if (error) return res.status(500).json({
    error: 'Eliminación parcial: los mantenimientos y repuestos fueron eliminados pero la máquina no. Contacte al administrador.',
  });
  res.json({ message: 'Máquina eliminada' });
};

const update = async (req, res) => {
  const { id } = req.params;
  const { nombre, descripcion, codigo, ubicacion, imagen_url, estado, fecha_ultima_inspeccion } = req.body;

  const { data, error } = await supabase
    .from('maquinas')
    .update({ nombre, descripcion, codigo, ubicacion, imagen_url, estado, fecha_ultima_inspeccion })
    .eq('id', id)
    .select()
    .single();

  if (error) return res.status(getHttpStatus(error)).json({ error: error.message });
  res.json(data);
};

module.exports = { getAll, getById, create, remove, update };

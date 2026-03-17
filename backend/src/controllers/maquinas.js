const supabase = require('../config/supabase');

const getById = async (req, res) => {
  const { id } = req.params;

  const { data, error } = await supabase
    .from('maquinas')
    .select('*')
    .eq('id', id)
    .single();

  if (error) return res.status(500).json({ error: error.message });
  if (!data) return res.status(404).json({ error: 'Máquina no encontrada' });
  res.json(data);
};

const getAll = async (req, res) => {
  const { data, error } = await supabase
    .from('maquinas')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
};

const create = async (req, res) => {
  const { nombre, descripcion, codigo, ubicacion, imagen_url, estado, fecha_ultima_inspeccion } = req.body;

  const { data, error } = await supabase
    .from('maquinas')
    .insert({ nombre, descripcion, codigo, ubicacion, imagen_url, estado, fecha_ultima_inspeccion })
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });
  res.status(201).json(data);
};

const remove = async (req, res) => {
  const { id } = req.params;

  const { error } = await supabase
    .from('maquinas')
    .delete()
    .eq('id', id);

  if (error) return res.status(500).json({ error: error.message });
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

  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
};

module.exports = { getAll, getById, create, remove, update };

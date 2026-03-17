const supabase = require('../config/supabase');

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

module.exports = { getAll, create, remove };

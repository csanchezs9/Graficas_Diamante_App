const supabase = require('../config/supabase');

const getAll = async (req, res) => {
  const { maquina_id } = req.query;

  let query = supabase
    .from('mantenimientos')
    .select('*, maquinas(nombre)')
    .order('fecha_realizacion', { ascending: false });

  if (maquina_id) {
    query = query.eq('maquina_id', maquina_id);
  }

  const { data, error } = await query;

  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
};

const create = async (req, res) => {
  const {
    maquina_id,
    fecha_realizacion,
    tecnico_responsable,
    descripcion,
    fotos_urls,
    costo_total,
    tipo,
  } = req.body;

  const { data, error } = await supabase
    .from('mantenimientos')
    .insert({
      maquina_id,
      fecha_realizacion,
      tecnico_responsable,
      descripcion,
      fotos_urls: fotos_urls || [],
      costo_total,
      tipo,
    })
    .select('*, maquinas(nombre)')
    .single();

  if (error) return res.status(500).json({ error: error.message });
  res.status(201).json(data);
};

const remove = async (req, res) => {
  const { id } = req.params;

  const { error } = await supabase
    .from('mantenimientos')
    .delete()
    .eq('id', id);

  if (error) return res.status(500).json({ error: error.message });
  res.json({ message: 'Mantenimiento eliminado' });
};

const update = async (req, res) => {
  const { id } = req.params;
  const fields = req.body;

  const { data, error } = await supabase
    .from('mantenimientos')
    .update(fields)
    .eq('id', id)
    .select('*, maquinas(nombre)')
    .single();

  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
};

module.exports = { getAll, create, remove, update };

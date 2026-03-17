const supabase = require('../config/supabase');

const getById = async (req, res) => {
  const { id } = req.params;

  const { data, error } = await supabase
    .from('mantenimientos')
    .select('*, maquinas(nombre)')
    .eq('id', id)
    .single();

  if (error) return res.status(500).json({ error: error.message });
  if (!data) return res.status(404).json({ error: 'Mantenimiento no encontrado' });
  res.json(data);
};

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

  const missing = [];
  if (!maquina_id) missing.push('máquina');
  if (!descripcion || !descripcion.trim()) missing.push('descripción');
  if (!tecnico_responsable || !tecnico_responsable.trim()) missing.push('técnico responsable');
  if (!tipo) missing.push('tipo');

  if (missing.length > 0) {
    return res.status(400).json({ error: `Campos requeridos: ${missing.join(', ')}` });
  }

  const { data, error } = await supabase
    .from('mantenimientos')
    .insert({
      maquina_id,
      fecha_realizacion,
      tecnico_responsable: tecnico_responsable.trim(),
      descripcion: descripcion.trim(),
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
  const cascade = req.query.cascade === 'true';

  // Verificar si tiene repuestos asociados
  const { count, error: countError } = await supabase
    .from('repuestos')
    .select('id', { count: 'exact', head: true })
    .eq('mantenimiento_id', id);

  if (countError) return res.status(500).json({ error: countError.message });

  if (count > 0) {
    if (!cascade) {
      return res.status(409).json({
        error: `Este mantenimiento tiene ${count} repuesto(s) asociado(s).`,
        count,
      });
    }

    // Cascade: borrar repuestos primero
    const { error: repError } = await supabase
      .from('repuestos')
      .delete()
      .eq('mantenimiento_id', id);

    if (repError) return res.status(500).json({ error: repError.message });
  }

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

module.exports = { getAll, getById, create, remove, update };

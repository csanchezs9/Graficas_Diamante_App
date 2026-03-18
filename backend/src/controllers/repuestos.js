const supabase = require('../config/supabase');
const { getHttpStatus } = require('../utils/httpError');

const getById = async (req, res) => {
  const { id } = req.params;

  const { data, error } = await supabase
    .from('repuestos')
    .select('*, mantenimientos(descripcion, maquina_id, maquinas(nombre))')
    .eq('id', id)
    .single();

  if (error) return res.status(getHttpStatus(error)).json({ error: error.message });
  if (!data) return res.status(404).json({ error: 'Repuesto no encontrado' });
  res.json(data);
};

const getAll = async (req, res) => {
  const { mantenimiento_id } = req.query;

  let query = supabase
    .from('repuestos')
    .select('*, mantenimientos(descripcion, maquina_id, maquinas(nombre))')
    .order('created_at', { ascending: false });

  if (mantenimiento_id) {
    query = query.eq('mantenimiento_id', mantenimiento_id);
  }

  const { data, error } = await query;

  if (error) return res.status(getHttpStatus(error)).json({ error: error.message });
  res.json(data);
};

const create = async (req, res) => {
  const {
    mantenimiento_id,
    nombre,
    tipo,
    cantidad_disponible,
    costo_unitario,
    proveedor,
    fecha,
    imagen_url,
  } = req.body;

  const missing = [];
  if (!mantenimiento_id) missing.push('mantenimiento');
  if (!nombre || !nombre.trim()) missing.push('nombre');
  if (!tipo) missing.push('tipo');

  if (missing.length > 0) {
    return res.status(400).json({ error: `Campos requeridos: ${missing.join(', ')}` });
  }

  if (cantidad_disponible !== undefined && cantidad_disponible !== null && cantidad_disponible !== '') {
    if (isNaN(Number(cantidad_disponible)) || Number(cantidad_disponible) < 0) {
      return res.status(400).json({ error: 'cantidad_disponible debe ser un número positivo' });
    }
  }

  if (costo_unitario !== undefined && costo_unitario !== null && costo_unitario !== '') {
    if (isNaN(Number(costo_unitario)) || Number(costo_unitario) < 0) {
      return res.status(400).json({ error: 'costo_unitario debe ser un número positivo' });
    }
  }

  const { data, error } = await supabase
    .from('repuestos')
    .insert({
      mantenimiento_id,
      nombre: nombre.trim(),
      tipo,
      cantidad_disponible: cantidad_disponible || 0,
      costo_unitario: costo_unitario || 0,
      proveedor,
      fecha,
      imagen_url,
    })
    .select('*, mantenimientos(descripcion, maquina_id, maquinas(nombre))')
    .single();

  if (error) return res.status(getHttpStatus(error)).json({ error: error.message });
  res.status(201).json(data);
};

const remove = async (req, res) => {
  const { id } = req.params;

  const { error } = await supabase
    .from('repuestos')
    .delete()
    .eq('id', id);

  if (error) return res.status(getHttpStatus(error)).json({ error: error.message });
  res.json({ message: 'Repuesto eliminado' });
};

const update = async (req, res) => {
  const { id } = req.params;
  const {
    nombre,
    tipo,
    cantidad_disponible,
    costo_unitario,
    proveedor,
    fecha,
    imagen_url,
  } = req.body;

  if (cantidad_disponible !== undefined && cantidad_disponible !== null && cantidad_disponible !== '') {
    if (isNaN(Number(cantidad_disponible)) || Number(cantidad_disponible) < 0) {
      return res.status(400).json({ error: 'cantidad_disponible debe ser un número positivo' });
    }
  }

  if (costo_unitario !== undefined && costo_unitario !== null && costo_unitario !== '') {
    if (isNaN(Number(costo_unitario)) || Number(costo_unitario) < 0) {
      return res.status(400).json({ error: 'costo_unitario debe ser un número positivo' });
    }
  }

  const { data, error } = await supabase
    .from('repuestos')
    .update({ nombre, tipo, cantidad_disponible, costo_unitario, proveedor, fecha, imagen_url })
    .eq('id', id)
    .select('*, mantenimientos(descripcion, maquina_id, maquinas(nombre))')
    .single();

  if (error) return res.status(getHttpStatus(error)).json({ error: error.message });
  res.json(data);
};

module.exports = { getAll, getById, create, remove, update };

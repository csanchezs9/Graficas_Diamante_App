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

  if (mantenimiento_id) {
    // Use junction table for many-to-many lookup
    const { data: junction, error: jErr } = await supabase
      .from('mantenimiento_repuestos')
      .select('repuesto_id')
      .eq('mantenimiento_id', mantenimiento_id);

    if (jErr) return res.status(getHttpStatus(jErr)).json({ error: jErr.message });

    const ids = (junction || []).map((r) => r.repuesto_id);
    if (ids.length === 0) return res.json([]);

    const { data, error } = await supabase
      .from('repuestos')
      .select('*, mantenimientos(descripcion, maquina_id, maquinas(nombre))')
      .in('id', ids)
      .order('created_at', { ascending: false });

    if (error) return res.status(getHttpStatus(error)).json({ error: error.message });
    return res.json(data);
  }

  const { data, error } = await supabase
    .from('repuestos')
    .select('*, mantenimientos(descripcion, maquina_id, maquinas(nombre))')
    .order('created_at', { ascending: false });

  if (error) return res.status(getHttpStatus(error)).json({ error: error.message });
  res.json(data);
};

const create = async (req, res) => {
  const {
    mantenimiento_id,
    nombre,
    codigo,
    tipo,
    cantidad_disponible,
    costo_unitario,
    proveedor,
    fecha,
    imagen_url,
  } = req.body;

  const missing = [];
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
      mantenimiento_id: mantenimiento_id || null,
      nombre: nombre.trim(),
      codigo: codigo?.trim() || null,
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
    codigo,
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
    .update({
      ...(nombre !== undefined && { nombre }),
      ...(codigo !== undefined && { codigo: codigo?.trim() || null }),
      ...(tipo !== undefined && { tipo }),
      ...(cantidad_disponible !== undefined && { cantidad_disponible }),
      ...(costo_unitario !== undefined && { costo_unitario }),
      ...(proveedor !== undefined && { proveedor }),
      ...(fecha !== undefined && { fecha }),
      ...(imagen_url !== undefined && { imagen_url }),
    })
    .eq('id', id)
    .select('*, mantenimientos(descripcion, maquina_id, maquinas(nombre))')
    .single();

  if (error) return res.status(getHttpStatus(error)).json({ error: error.message });
  res.json(data);
};

module.exports = { getAll, getById, create, remove, update };

const supabase = require('../config/supabase');
const { getHttpStatus } = require('../utils/httpError');

const link = async (req, res) => {
  const { id: mantenimiento_id } = req.params;
  const { repuesto_id } = req.body;

  if (!repuesto_id) {
    return res.status(400).json({ error: 'repuesto_id es requerido' });
  }

  const { error } = await supabase
    .from('mantenimiento_repuestos')
    .upsert({ mantenimiento_id, repuesto_id }, { onConflict: 'mantenimiento_id,repuesto_id' });

  if (error) return res.status(getHttpStatus(error)).json({ error: error.message });
  res.status(201).json({ mantenimiento_id, repuesto_id });
};

const unlink = async (req, res) => {
  const { id: mantenimiento_id, repuesto_id } = req.params;

  const { error } = await supabase
    .from('mantenimiento_repuestos')
    .delete()
    .eq('mantenimiento_id', mantenimiento_id)
    .eq('repuesto_id', repuesto_id);

  if (error) return res.status(getHttpStatus(error)).json({ error: error.message });
  res.json({ message: 'Repuesto desvinculado' });
};

module.exports = { link, unlink };

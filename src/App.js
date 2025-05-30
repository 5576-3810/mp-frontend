import React, { useEffect, useState } from 'react';
import axios from 'axios';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

function App() {
  const [fiscales, setFiscales] = useState([]);
  const [casos, setCasos] = useState([]);
  const [formFiscal, setFormFiscal] = useState({ nombre: '', correo: '', id_fiscalia: 1 });
  const [descripcion, setDescripcion] = useState('');
  const [estado, setEstado] = useState('');
  const [id_fiscal, setIdFiscal] = useState('');
  const [reasignacion, setReasignacion] = useState({ id_caso: '', id_nuevo_fiscal: '' });
  const [estadisticas, setEstadisticas] = useState([]);
  const [logs, setLogs] = useState([]);
  const [filtroFiscal, setFiltroFiscal] = useState('');
  const [busquedaDescripcion, setBusquedaDescripcion] = useState('');

  const fetchFiscales = async () => {
    const res = await axios.get('http://localhost:3000/api/fiscales');
    setFiscales(res.data);
  };

  const fetchCasos = async () => {
    const res = await axios.get('http://localhost:3000/api/casos');
    setCasos(res.data);
  };

  const fetchEstadisticas = async () => {
    const res = await axios.get('http://localhost:3000/api/estadisticas');
    setEstadisticas(res.data);
  };

  const fetchLogs = async () => {
    const res = await axios.get('http://localhost:3000/api/logs');
    setLogs(res.data);
  };

  useEffect(() => {
    fetchFiscales();
    fetchCasos();
    fetchEstadisticas();
    fetchLogs();
  }, []);

  const handleSubmitFiscal = async (e) => {
    e.preventDefault();
    await axios.post('http://localhost:3000/api/fiscales', formFiscal);
    setFormFiscal({ nombre: '', correo: '', id_fiscalia: 1 });
    fetchFiscales();
  };

  const handleSubmitCaso = async (e) => {
    e.preventDefault();
    if (!['Pendiente', 'Cerrado'].includes(estado)) {
      alert('Estado no válido');
      return;
    }
    try {
      await axios.post('http://localhost:3000/api/casos', { descripcion, estado, id_fiscal: Number(id_fiscal) });
      fetchCasos();
      setDescripcion('');
      setEstado('');
      setIdFiscal('');
    } catch (err) {
      alert('Error al registrar el caso');
    }
  };

  const handleReasignar = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post('http://localhost:3000/api/casos/reasignar', {
        id_caso: Number(reasignacion.id_caso),
        id_nuevo_fiscal: Number(reasignacion.id_nuevo_fiscal)
      });
      alert(res.data);
      fetchCasos();
      fetchLogs();
    } catch (err) {
      alert(err.response?.data || 'Error al reasignar');
    }
  };

  const casosFiltrados = casos.filter(c =>
    (!filtroFiscal || c.id_fiscal === Number(filtroFiscal)) &&
    c.descripcion.toLowerCase().includes(busquedaDescripcion.toLowerCase())
  );

  const exportarPDF = () => {
    const doc = new jsPDF();
    const columnas = ['ID', 'Descripción', 'Estado', 'ID Fiscal'];
    const filas = casos.map(c => [c.id_caso, c.descripcion, c.estado, c.id_fiscal]);

    autoTable(doc, { head: [columnas], body: filas });
    doc.save('casos.pdf');
  };

  const sectionStyle = {
    margin: '2rem 0',
    padding: '1rem',
    background: '#f4f4f4',
    borderRadius: '6px'
  };

  const headerStyle = {
    color: '#2c3e50',
    marginBottom: '1rem'
  };

  return (
    <div style={{ fontFamily: 'Arial', padding: '2rem', background: '#fff' }}>
      <h2 style={{ color: '#2980b9' }}>Fiscales</h2>
      <ul>
        {fiscales.map(f => (
          <li key={f.id_fiscal}>
            {f.nombre} ({f.correo}) — Fiscalía #{f.id_fiscalia}
          </li>
        ))}
      </ul>

      <div style={sectionStyle}>
        <h3 style={headerStyle}>Agregar Fiscal</h3>
        <form onSubmit={handleSubmitFiscal}>
          <input placeholder="Nombre" value={formFiscal.nombre}
            onChange={(e) => setFormFiscal({ ...formFiscal, nombre: e.target.value })} />
          <input placeholder="Correo" value={formFiscal.correo}
            onChange={(e) => setFormFiscal({ ...formFiscal, correo: e.target.value })} />
          <input type="number" placeholder="Fiscalía" value={formFiscal.id_fiscalia}
            onChange={(e) => setFormFiscal({ ...formFiscal, id_fiscalia: Number(e.target.value) })} />
          <button type="submit">Agregar</button>
        </form>
      </div>

      <div style={sectionStyle}>
        <h2 style={headerStyle}>Casos</h2>
        <button onClick={exportarPDF}>Exportar Casos a PDF</button>
        <ul>
          {casos.map(c => (
            <li key={c.id_caso}>
              #{c.id_caso} - {c.descripcion} — Estado: {c.estado} — Fiscal: {c.id_fiscal}
            </li>
          ))}
        </ul>
      </div>

      <div style={sectionStyle}>
        <h3 style={headerStyle}>Registrar nuevo caso</h3>
        <form onSubmit={handleSubmitCaso}>
          <input placeholder="Descripción" value={descripcion}
            onChange={(e) => setDescripcion(e.target.value)} />
          <select value={estado} onChange={(e) => setEstado(e.target.value)}>
            <option value="">Estado</option>
            <option value="Pendiente">Pendiente</option>
            <option value="Cerrado">Cerrado</option>
          </select>
          <select value={id_fiscal} onChange={(e) => setIdFiscal(e.target.value)}>
            <option value="">Fiscal</option>
            {fiscales.map(f => (
              <option key={f.id_fiscal} value={f.id_fiscal}>{f.nombre}</option>
            ))}
          </select>
          <button>Registrar</button>
        </form>
      </div>

      <div style={sectionStyle}>
        <h3 style={headerStyle}>Reasignar Caso</h3>
        <form onSubmit={handleReasignar}>
          <select value={reasignacion.id_caso}
            onChange={(e) => setReasignacion({ ...reasignacion, id_caso: e.target.value })}>
            <option value="">Seleccionar caso</option>
            {casos.map(c => (
              <option key={c.id_caso} value={c.id_caso}>
                #{c.id_caso} - {c.descripcion}
              </option>
            ))}
          </select>

          <select value={reasignacion.id_nuevo_fiscal}
            onChange={(e) => setReasignacion({ ...reasignacion, id_nuevo_fiscal: e.target.value })}>
            <option value="">Nuevo fiscal</option>
            {fiscales.map(f => (
              <option key={f.id_fiscal} value={f.id_fiscal}>{f.nombre}</option>
            ))}
          </select>
          <button>Reasignar</button>
        </form>
      </div>

      <div style={sectionStyle}>
        <h2 style={headerStyle}>Historial de Reasignaciones</h2>
        <table border="1" cellPadding={5}>
          <thead>
            <tr>
              <th>ID</th><th>Caso</th><th>Fiscal anterior</th><th>Fiscal nuevo</th><th>Motivo</th><th>Fecha</th>
            </tr>
          </thead>
          <tbody>
            {logs.map(log => (
              <tr key={log.id_log}>
                <td>{log.id_log}</td>
                <td>{log.caso_descripcion}</td>
                <td>{log.fiscal_anterior}</td>
                <td>{log.fiscal_nuevo}</td>
                <td>{log.motivo}</td>
                <td>{log.fecha}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div style={sectionStyle}>
        <h2 style={headerStyle}>Estadísticas por Fiscal</h2>
        <table border="1" cellPadding={5}>
          <thead>
            <tr><th>Fiscal</th><th>Total</th><th>Pendientes</th><th>Proceso</th><th>Cerrados</th></tr>
          </thead>
          <tbody>
            {estadisticas.map(f => (
              <tr key={f.id_fiscal}>
                <td>{f.nombre}</td>
                <td>{f.total_casos}</td>
                <td>{f.pendientes}</td>
                <td>{f.en_proceso}</td>
                <td>{f.cerrados}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div style={sectionStyle}>
        <h3 style={headerStyle}>Filtrar Casos</h3>
        <select value={filtroFiscal} onChange={(e) => setFiltroFiscal(e.target.value)}>
          <option value="">Todos</option>
          {fiscales.map(f => (
            <option key={f.id_fiscal} value={f.id_fiscal}>{f.nombre}</option>
          ))}
        </select>
        <input
          placeholder="Buscar por descripción"
          value={busquedaDescripcion}
          onChange={(e) => setBusquedaDescripcion(e.target.value)}
        />
        <ul>
          {casosFiltrados.map(c => (
            <li key={c.id_caso}>
              #{c.id_caso} - {c.descripcion} — Estado: {c.estado} — Fiscal: {c.id_fiscal}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export default App;

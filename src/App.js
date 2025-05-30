import React, { useEffect, useState } from 'react';
import axios from 'axios';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';


function App() {
  const [fiscales, setFiscales] = useState([]);
  const [casos, setCasos] = useState([]);
  const [logs, setLogs] = useState([]);
  const [estadisticas, setEstadisticas] = useState([]);
  const [descripcion, setDescripcion] = useState('');
  const [estado, setEstado] = useState('');
  const [id_fiscal, setIdFiscal] = useState('');
  const [formFiscal, setFormFiscal] = useState({ nombre: '', correo: '', id_fiscalia: 1 });
  const [reasignacion, setReasignacion] = useState({ id_caso: '', id_nuevo_fiscal: '' });
  const [filtroFiscal, setFiltroFiscal] = useState('');
  const [busquedaDescripcion, setBusquedaDescripcion] = useState('');

  useEffect(() => {
    fetchFiscales();
    fetchCasos();
    fetchLogs();
    fetchEstadisticas();
  }, []);

  const fetchFiscales = async () => {
    const res = await axios.get('http://localhost:3000/api/fiscales');
    setFiscales(res.data);
  };

  const fetchCasos = async () => {
    const res = await axios.get('http://localhost:3000/api/casos');
    setCasos(res.data);
  };

  const fetchLogs = async () => {
    const res = await axios.get('http://localhost:3000/api/logs');
    setLogs(res.data);
  };

  const fetchEstadisticas = async () => {
    const res = await axios.get('http://localhost:3000/api/estadisticas');
    setEstadisticas(res.data);
  };

  const handleSubmitFiscal = async (e) => {
    e.preventDefault();
    await axios.post('http://localhost:3000/api/fiscales', formFiscal);
    setFormFiscal({ nombre: '', correo: '', id_fiscalia: 1 });
    fetchFiscales();
  };

  const handleSubmitCaso = async (e) => {
    e.preventDefault();
    if (!['Pendiente', 'Cerrado'].includes(estado)) {
      return alert('Solo se permite estado "Pendiente" o "Cerrado"');
    }
    await axios.post('http://localhost:3000/api/casos', {
      descripcion,
      estado,
      id_fiscal: Number(id_fiscal)
    });
    setDescripcion('');
    setEstado('');
    setIdFiscal('');
    fetchCasos();
  };

  const handleReasignar = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post('http://localhost:3000/api/casos/reasignar', {
        id_caso: Number(reasignacion.id_caso),
        id_nuevo_fiscal: Number(reasignacion.id_nuevo_fiscal)
      });
      alert(res.data || 'Reasignado');
      setReasignacion({ id_caso: '', id_nuevo_fiscal: '' });
      fetchCasos();
      fetchLogs();
    } catch (err) {
      alert(err.response?.data || 'Error');
    }
  };

  const exportarPDF = () => {
    const doc = new jsPDF();
    autoTable(doc, {
      head: [['ID', 'Descripción', 'Estado', 'Fiscal']],
      body: casos.map(c => [c.id_caso, c.descripcion, c.estado, c.id_fiscal])
    });
    doc.save('casos.pdf');
  };

  const casosFiltrados = casos.filter(c => {
    const fMatch = filtroFiscal ? c.id_fiscal === Number(filtroFiscal) : true;
    const dMatch = c.descripcion.toLowerCase().includes(busquedaDescripcion.toLowerCase());
    return fMatch && dMatch;
  });

  return (
    <div className="container my-4">
      <h1 className="mb-4 text-center">Ministerio Público</h1>

      <section className="mb-5">
        <h3>Fiscales</h3>
        <ul>
          {fiscales.map(f => (
            <li key={f.id_fiscal}>
              {f.nombre} ({f.correo}) — Fiscalía #{f.id_fiscalia}
            </li>
          ))}
        </ul>

        <form className="row g-2 mt-2" onSubmit={handleSubmitFiscal}>
          <div className="col-md-3">
            <input className="form-control" placeholder="Nombre" value={formFiscal.nombre}
              onChange={e => setFormFiscal({ ...formFiscal, nombre: e.target.value })} />
          </div>
          <div className="col-md-3">
            <input className="form-control" placeholder="Correo" value={formFiscal.correo}
              onChange={e => setFormFiscal({ ...formFiscal, correo: e.target.value })} />
          </div>
          <div className="col-md-2">
            <input className="form-control" type="number" placeholder="Fiscalía" value={formFiscal.id_fiscalia}
              onChange={e => setFormFiscal({ ...formFiscal, id_fiscalia: Number(e.target.value) })} />
          </div>
          <div className="col-md-2">
            <button className="btn btn-primary w-100" type="submit">Agregar Fiscal</button>
          </div>
        </form>
      </section>

      <section className="mb-5">
        <h3>Casos</h3>

        <button onClick={exportarPDF} className="btn btn-outline-danger mb-3">Exportar PDF</button>

        <ul>
          {casos.map(c => (
            <li key={c.id_caso}>
              #{c.id_caso} - {c.descripcion} — Estado: {c.estado} — Fiscal: {c.id_fiscal}
            </li>
          ))}
        </ul>

        <form className="row g-2 mt-2" onSubmit={handleSubmitCaso}>
          <div className="col-md-4">
            <input className="form-control" placeholder="Descripción"
              value={descripcion} onChange={e => setDescripcion(e.target.value)} required />
          </div>
          <div className="col-md-3">
            <select className="form-select" value={estado} onChange={e => setEstado(e.target.value)} required>
              <option value="">Estado</option>
              <option value="Pendiente">Pendiente</option>
              <option value="Cerrado">Cerrado</option>
            </select>
          </div>
          <div className="col-md-3">
            <select className="form-select" value={id_fiscal} onChange={e => setIdFiscal(e.target.value)} required>
              <option value="">Fiscal</option>
              {fiscales.map(f => (
                <option key={f.id_fiscal} value={f.id_fiscal}>
                  {f.nombre} (#{f.id_fiscalia})
                </option>
              ))}
            </select>
          </div>
          <div className="col-md-2">
            <button className="btn btn-success w-100" type="submit">Registrar</button>
          </div>
        </form>
      </section>

      <section className="mb-5">
        <h3>Reasignar Caso</h3>
        <form className="row g-2" onSubmit={handleReasignar}>
          <div className="col-md-5">
            <select className="form-select" value={reasignacion.id_caso}
              onChange={e => setReasignacion({ ...reasignacion, id_caso: e.target.value })} required>
              <option value="">Seleccionar caso</option>
              {casos.map(c => (
                <option key={c.id_caso} value={c.id_caso}>#{c.id_caso} - {c.descripcion}</option>
              ))}
            </select>
          </div>
          <div className="col-md-5">
            <select className="form-select" value={reasignacion.id_nuevo_fiscal}
              onChange={e => setReasignacion({ ...reasignacion, id_nuevo_fiscal: e.target.value })} required>
              <option value="">Nuevo fiscal</option>
              {fiscales.map(f => (
                <option key={f.id_fiscal} value={f.id_fiscal}>
                  {f.nombre} (#{f.id_fiscalia})
                </option>
              ))}
            </select>
          </div>
          <div className="col-md-2">
            <button className="btn btn-warning w-100" type="submit">Reasignar</button>
          </div>
        </form>
      </section>

      <section className="mb-5">
        <h3>Historial de Reasignaciones</h3>
        <div className="table-responsive">
          <table className="table table-bordered table-sm">
            <thead className="table-light">
              <tr>
                <th>ID</th>
                <th>Caso</th>
                <th>Anterior</th>
                <th>Nuevo</th>
                <th>Motivo</th>
                <th>Fecha</th>
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
      </section>

      <section className="mb-5">
        <h3>Estadísticas por Fiscal</h3>
        <div className="table-responsive">
          <table className="table table-striped table-hover">
            <thead>
              <tr>
                <th>Fiscal</th>
                <th>Total</th>
                <th>Pendientes</th>
                <th>En Proceso</th>
                <th>Cerrados</th>
              </tr>
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
      </section>

      <section className="mb-5">
        <h4>Filtrar Casos</h4>
        <div className="row g-2 mb-3">
          <div className="col-md-4">
            <select className="form-select" value={filtroFiscal} onChange={e => setFiltroFiscal(e.target.value)}>
              <option value="">Todos</option>
              {fiscales.map(f => (
                <option key={f.id_fiscal} value={f.id_fiscal}>{f.nombre}</option>
              ))}
            </select>
          </div>
          <div className="col-md-6">
            <input className="form-control" placeholder="Buscar descripción"
              value={busquedaDescripcion} onChange={e => setBusquedaDescripcion(e.target.value)} />
          </div>
        </div>

        <ul className="list-group">
          {casosFiltrados.map(c => (
            <li className="list-group-item" key={c.id_caso}>
              #{c.id_caso} - {c.descripcion} — Estado: {c.estado} — Fiscal: {c.id_fiscal}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

export default App;

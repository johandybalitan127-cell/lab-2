// ============================================================================
// ARCHIVO: frontend/src/pages/AsistentePage.jsx
// DESCRIPCIÓN: Vista de integración con el Agente de Inteligencia Artificial (n8n)
// ============================================================================
import React, { useState } from 'react';
import { api } from '../services/api';
import { useFetch } from '../hooks/useFetch';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { Alert } from '../components/Alert';

export function AsistentePage() {
  const { data: resumenData } = useFetch(() => api.getResumen());
  
  // URL por defecto del Webhook en n8n
  const [webhookUrl, setWebhookUrl] = useState('http://localhost:4000/api/agente-ia');
  const [consulta, setConsulta] = useState('Analiza los productos con stock crítico y genera una lista de compras sugerida con prioridades.');
  const [respuestaIA, setRespuestaIA] = useState(null);
  const [avisoIA, setAvisoIA] = useState('');
  const [consultando, setConsultando] = useState(false);
  const [errorIA, setErrorIA] = useState('');

  const productosCriticos = resumenData?.productos_criticos || [];

  const handleConsultar = async (e) => {
    e.preventDefault();
    if (!consulta.trim()) return;

    setConsultando(true);
    setErrorIA('');
    setAvisoIA('');
    setRespuestaIA(null);

    const payload = {
      consulta: consulta.trim(),
      contexto: {
        total_productos_criticos: productosCriticos.length,
        productos_en_alerta: productosCriticos,
        ingresos_totales: resumenData?.resumen?.ingresos_totales || 0,
        ticket_promedio: resumenData?.resumen?.ticket_promedio || 0
      }
    };

    try {
      const res = await api.consultarWebhookIA(webhookUrl, payload);
      
      // Contrato estandarizado del laboratorio: { ok, data, error }
      if (res && res.ok === true) {
        setRespuestaIA(res.data);
        if (res.aviso) setAvisoIA(res.aviso);
      } else {
        const mensaje = res?.error || 'El agente de IA no devolvió una respuesta válida.';
        setErrorIA(mensaje);
      }
    } catch (err) {
      setErrorIA(
        `No se pudo conectar con el endpoint en ${webhookUrl}. ` +
        `Verifica que el servidor esté activo.`
      );
    } finally {
      setConsultando(false);
    }
  };

  return (
    <div style={{ maxWidth: '850px', margin: '0 auto' }}>
      <div style={{ marginBottom: '1.5rem' }}>
        <h1>🤖 Agente de IA para Cafetería (n8n)</h1>
        <p className="subtitle">
          Asistente inteligente integrado con n8n mediante Webhook, modelo LLM y contrato <code>{`{ ok, data, error }`}</code>
        </p>
      </div>

      {/* Resumen del contexto actual */}
      <div className="card" style={{ marginBottom: '1.5rem', background: 'var(--color-bg-subtle)' }}>
        <h4 style={{ marginBottom: '0.5rem', color: 'var(--color-primary)' }}>📦 Contexto en Tiempo Real del Inventario</h4>
        <p style={{ fontSize: '0.9rem', color: 'var(--color-text-muted)' }}>
          Actualmente el sistema reporta <strong>{productosCriticos.length} productos</strong> con inventario igual o inferior a su stock mínimo. Este contexto se enviará automáticamente al Agente para fundamentar sus recomendaciones.
        </p>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginTop: '0.75rem' }}>
          {productosCriticos.map(p => (
            <span key={p.id} className="badge badge-warning">
              {p.nombre}: {p.stock} unid. (Mín: {p.stock_minimo})
            </span>
          ))}
        </div>
      </div>

      {errorIA && <Alert type="danger" message={errorIA} onClose={() => setErrorIA('')} />}

      {/* Formulario de consulta */}
      <form onSubmit={handleConsultar} className="card" style={{ marginBottom: '1.5rem' }}>
        <div className="form-group">
          <label className="form-label" htmlFor="webhook">URL del Webhook de n8n</label>
          <input 
            id="webhook"
            type="text" 
            className="form-control"
            value={webhookUrl}
            onChange={(e) => setWebhookUrl(e.target.value)}
            placeholder="http://localhost:5678/webhook/..."
          />
          <small style={{ color: 'var(--color-text-muted)', fontSize: '0.8rem', display: 'block', marginBottom: '0.5rem' }}>
            Selecciona el destino según el estado de tu servidor:
          </small>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            <button 
              type="button" 
              className={`btn btn-sm ${webhookUrl.includes(':4000') ? 'btn-primary' : 'btn-outline'}`}
              onClick={() => setWebhookUrl('http://localhost:4000/api/agente-ia')}
            >
              🛡️ API Local (:4000) [Recomendado]
            </button>
            <button 
              type="button" 
              className={`btn btn-sm ${webhookUrl.includes('webhook-test') ? 'btn-primary' : 'btn-outline'}`}
              onClick={() => setWebhookUrl('http://localhost:5678/webhook-test/asistente-cafeteria')}
            >
              🧪 n8n Modo Test (:5678)
            </button>
            <button 
              type="button" 
              className={`btn btn-sm ${webhookUrl.includes(':5678') && !webhookUrl.includes('webhook-test') ? 'btn-primary' : 'btn-outline'}`}
              onClick={() => setWebhookUrl('http://localhost:5678/webhook/asistente-cafeteria')}
            >
              🚀 n8n Publicado (:5678)
            </button>
          </div>
        </div>

        <div className="form-group">
          <label className="form-label" htmlFor="consulta">Instrucción o Pregunta al Agente</label>
          <textarea 
            id="consulta"
            className="form-control"
            rows="3"
            value={consulta}
            onChange={(e) => setConsulta(e.target.value)}
          />
        </div>

        {/* Botones de sugerencias rápidas */}
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
          <button 
            type="button" 
            className="btn btn-outline btn-sm"
            onClick={() => setConsulta('Analiza los productos con stock crítico y genera una lista de compras sugerida con prioridades.')}
          >
            📋 Sugerir Reabastecimiento
          </button>
          <button 
            type="button" 
            className="btn btn-outline btn-sm"
            onClick={() => setConsulta('Propón 2 promociones o combos del día para aumentar el ticket promedio y rotar el stock disponible.')}
          >
            🏷️ Sugerir Promociones / Combos
          </button>
        </div>

        <button 
          type="submit" 
          className="btn btn-primary"
          style={{ width: '100%', padding: '0.85rem' }}
          disabled={consultando}
        >
          {consultando ? 'Consultando al Agente de n8n...' : '🚀 Enviar Consulta al Agente IA'}
        </button>
      </form>

      {/* Respuesta del Agente IA */}
      {consultando && <LoadingSpinner text="El Agente IA está razonando sobre los datos del negocio..." />}

      {avisoIA && (
        <Alert type="warning" message={avisoIA} onClose={() => setAvisoIA('')} />
      )}

      {respuestaIA && (
        <div className="card" style={{ borderLeft: '4px solid var(--color-accent)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h3>💡 Respuesta del Agente Inteligente</h3>
            <span className="badge badge-success">ok: true</span>
          </div>

          <div style={{ background: '#faf8f5', padding: '1.25rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', whiteSpace: 'pre-line', lineHeight: '1.7' }}>
            {typeof respuestaIA === 'string' 
              ? respuestaIA 
              : respuestaIA.mensaje || JSON.stringify(respuestaIA, null, 2)}
          </div>
        </div>
      )}
    </div>
  );
}

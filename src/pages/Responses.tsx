import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { Form, FormField, FormResponse } from '@/types/form';
import { ArrowLeft } from 'lucide-react';
import { motion } from 'framer-motion';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

export default function Responses() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [form, setForm] = useState<Form | null>(null);
  const [responses, setResponses] = useState<FormResponse[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) loadData(id);
  }, [id]);

  const loadData = async (formId: string) => {
    const [formRes, responsesRes] = await Promise.all([
      supabase.from('forms').select('*').eq('id', formId).single(),
      supabase.from('responses').select('*').eq('form_id', formId).order('created_at', { ascending: false }),
    ]);
    setForm(formRes.data as unknown as Form | null);
    setResponses((responsesRes.data || []) as unknown as FormResponse[]);
    setLoading(false);
  };

  if (loading) return <div className="flex min-h-screen items-center justify-center"><div className="mono-progress w-32 animate-pulse" /></div>;
  if (!form) return <div className="flex min-h-screen items-center justify-center"><p className="mono-label">Form not found</p></div>;

  const fields = [...(form.fields || [])].sort((a, b) => a.order - b.order);

  const getFieldStats = (field: FormField) => {
    const values = responses.map(r => (r.data as Record<string, unknown>)[field.id]).filter(v => v !== undefined && v !== null && v !== '');

    if (['dropdown', 'radio'].includes(field.type)) {
      const counts: Record<string, number> = {};
      values.forEach(v => { counts[v as string] = (counts[v as string] || 0) + 1; });
      return Object.entries(counts).map(([name, value]) => ({ name, value }));
    }

    if (field.type === 'checkbox') {
      const trueCount = values.filter(v => v === true).length;
      return [{ name: 'Yes', value: trueCount }, { name: 'No', value: values.length - trueCount }];
    }

    if (field.type === 'range') {
      const nums = values.map(Number);
      const avg = nums.reduce((a, b) => a + b, 0) / nums.length;
      return { avg: Math.round(avg * 10) / 10, min: Math.min(...nums), max: Math.max(...nums), count: nums.length };
    }

    return null;
  };

  const COLORS = ['hsl(0,0%,0%)', 'hsl(0,0%,30%)', 'hsl(0,0%,50%)', 'hsl(0,0%,70%)', 'hsl(0,0%,85%)'];

  return (
    <div className="min-h-screen">
      <header className="border-b border-foreground sticky top-0 bg-background z-10">
        <div className="container mx-auto px-4 py-4 flex items-center gap-4">
          <button onClick={() => navigate('/dashboard')} className="p-2 hover:bg-foreground hover:text-background transition-colors">
            <ArrowLeft className="w-4 h-4" />
          </button>
          <span className="mono-label text-muted-foreground">Responses</span>
        </div>
      </header>

      <main className="container mx-auto px-4 py-12 max-w-4xl">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <div className="mb-12">
            <h1 className="text-2xl font-bold">{form.title}</h1>
            <div className="flex gap-6 mt-4">
              <div className="mono-card flex-1 text-center py-8">
                <p className="text-2xl font-bold tabular-nums">{responses.length}</p>
                <p className="mono-label text-muted-foreground mt-2">Response{responses.length !== 1 ? 's' : ''}</p>
              </div>
              <div className="mono-card flex-1 text-center py-8">
                <p className="text-2xl font-bold tabular-nums">{fields.length}</p>
                <p className="mono-label text-muted-foreground mt-2">Fields</p>
              </div>
            </div>
          </div>

          {/* Charts per field */}
          {/* <div className="space-y-8">
            {fields.map(field => {
              const stats = getFieldStats(field);
              if (!stats) {
                // Text fields - show recent values
                const values = responses.map(r => (r.data as Record<string, unknown>)[field.id]).filter(Boolean);
                return (
                  <div key={field.id} className="mono-card">
                    <p className="mono-label mb-4">{field.label}</p>
                    <div className="space-y-2 max-h-40 overflow-y-auto">
                      {values.slice(0, 10).map((v, i) => (
                        <p key={i} className="text-sm border-b border-muted py-2">{String(v)}</p>
                      ))}
                      {values.length === 0 && <p className="text-sm text-muted-foreground">No responses yet</p>}
                    </div>
                  </div>
                );
              }

              if (Array.isArray(stats)) {
                return (
                  <div key={field.id} className="mono-card">
                    <p className="mono-label mb-6">{field.label}</p>
                    <div className="flex flex-col md:flex-row gap-8">
                      <div className="flex-1 h-48">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={stats}>
                            <CartesianGrid strokeDasharray="3 3" stroke="hsl(0,0%,85%)" />
                            <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                            <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                            <Bar dataKey="value" fill="hsl(0,0%,0%)" />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                      <div className="w-48 h-48">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie data={stats} cx="50%" cy="50%" outerRadius={70} dataKey="value" label={({ name }) => name}>
                              {stats.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                            </Pie>
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  </div>
                );
              }

              // Range stats
              return (
                <div key={field.id} className="mono-card">
                  <p className="mono-label mb-4">{field.label}</p>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="text-center">
                      <p className="text-2xl font-bold tabular-nums">{stats.avg}</p>
                      <p className="mono-label text-muted-foreground">Average</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold tabular-nums">{stats.min}</p>
                      <p className="mono-label text-muted-foreground">Min</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold tabular-nums">{stats.max}</p>
                      <p className="mono-label text-muted-foreground">Max</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div> */}

          {/* Raw responses table */}
          {responses.length > 0 && (
            <div className="mt-12">
              <p className="mono-label mb-4">Raw Responses</p>
              <div className="overflow-x-auto">
                <table className="w-full border border-foreground">
                  <thead className="bg-gray-200">
                    <tr>
                      <th className="border border-foreground p-3 mono-label text-left">#</th>
                      {fields.map(f => (
                        <th key={f.id} className="border border-foreground p-3 mono-label text-left">{f.label}</th>
                      ))}
                      <th className="border border-foreground p-3 mono-label text-left">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {responses.map((resp, i) => (
                      <tr key={resp.id} className="hover:bg-muted transition-colors">
                        <td className="border border-foreground p-3 text-sm tabular-nums">{i + 1}</td>
                        {fields.map(f => (
                          <td key={f.id} className="border border-foreground p-3 text-sm">
                            {String((resp.data as Record<string, unknown>)[f.id] ?? '—')}
                          </td>
                        ))}
                        <td className="border border-foreground p-3 text-sm tabular-nums">
                          {new Date(resp.created_at).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </motion.div>
      </main>
    </div>
  );
}

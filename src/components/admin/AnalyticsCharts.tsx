import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';

interface ServiceRequest {
  id: string;
  title: string;
  status: string;
  priority: string;
  service_type?: string;
  created_at: string;
  assigned_pm_id?: string | null;
}

interface ProjectManager {
  id: string;
  name: string;
  is_available: boolean;
}

interface AnalyticsChartsProps {
  requests: ServiceRequest[];
  projectManagers: ProjectManager[];
}

const COLORS = ['hsl(217, 91%, 60%)', 'hsl(142, 76%, 36%)', 'hsl(38, 92%, 50%)', 'hsl(0, 84%, 60%)', 'hsl(280, 65%, 60%)', 'hsl(180, 65%, 45%)'];

const AnalyticsCharts = ({ requests, projectManagers }: AnalyticsChartsProps) => {
  // Request trends by month
  const requestTrends = useMemo(() => {
    const months: Record<string, number> = {};
    requests.forEach(r => {
      const date = new Date(r.created_at);
      const key = `${date.toLocaleString('default', { month: 'short' })} ${date.getFullYear()}`;
      months[key] = (months[key] || 0) + 1;
    });
    return Object.entries(months).slice(-6).map(([month, count]) => ({ month, count }));
  }, [requests]);

  // Status distribution
  const statusDistribution = useMemo(() => {
    const counts: Record<string, number> = {};
    requests.forEach(r => {
      const label = r.status.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
      counts[label] = (counts[label] || 0) + 1;
    });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [requests]);

  // PM workload
  const pmWorkload = useMemo(() => {
    const workload: Record<string, number> = {};
    projectManagers.forEach(pm => { workload[pm.name] = 0; });
    requests.forEach(r => {
      if (r.assigned_pm_id) {
        const pm = projectManagers.find(p => p.id === r.assigned_pm_id);
        if (pm) workload[pm.name] = (workload[pm.name] || 0) + 1;
      }
    });
    return Object.entries(workload).map(([name, projects]) => ({ name, projects }));
  }, [requests, projectManagers]);

  // Popular services
  const popularServices = useMemo(() => {
    const counts: Record<string, number> = {};
    requests.forEach(r => {
      const type = r.service_type || 'Unspecified';
      counts[type] = (counts[type] || 0) + 1;
    });
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([name, value]) => ({ name, value }));
  }, [requests]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
      {/* Request Trends */}
      <Card className="glass-card">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm sm:text-base">Request Trends</CardTitle>
        </CardHeader>
        <CardContent>
          {requestTrends.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">No data yet</p>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={requestTrends}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(0 0% 20%)" />
                <XAxis dataKey="month" tick={{ fill: 'hsl(0 0% 65%)', fontSize: 11 }} />
                <YAxis tick={{ fill: 'hsl(0 0% 65%)', fontSize: 11 }} allowDecimals={false} />
                <Tooltip contentStyle={{ background: 'hsl(0 0% 5%)', border: '1px solid hsl(0 0% 20%)', borderRadius: '8px', color: '#fff' }} />
                <Bar dataKey="count" fill="hsl(217, 91%, 60%)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {/* Status Distribution */}
      <Card className="glass-card">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm sm:text-base">Status Distribution</CardTitle>
        </CardHeader>
        <CardContent>
          {statusDistribution.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">No data yet</p>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={statusDistribution} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={4} dataKey="value">
                  {statusDistribution.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ background: 'hsl(0 0% 5%)', border: '1px solid hsl(0 0% 20%)', borderRadius: '8px', color: '#fff' }} />
                <Legend wrapperStyle={{ fontSize: '12px' }} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {/* PM Workload */}
      <Card className="glass-card">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm sm:text-base">PM Workload</CardTitle>
        </CardHeader>
        <CardContent>
          {pmWorkload.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">No PMs yet</p>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={pmWorkload} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(0 0% 20%)" />
                <XAxis type="number" tick={{ fill: 'hsl(0 0% 65%)', fontSize: 11 }} allowDecimals={false} />
                <YAxis type="category" dataKey="name" tick={{ fill: 'hsl(0 0% 65%)', fontSize: 11 }} width={80} />
                <Tooltip contentStyle={{ background: 'hsl(0 0% 5%)', border: '1px solid hsl(0 0% 20%)', borderRadius: '8px', color: '#fff' }} />
                <Bar dataKey="projects" fill="hsl(142, 76%, 36%)" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {/* Popular Services */}
      <Card className="glass-card">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm sm:text-base">Popular Services</CardTitle>
        </CardHeader>
        <CardContent>
          {popularServices.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">No data yet</p>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={popularServices} cx="50%" cy="50%" outerRadius={80} paddingAngle={3} dataKey="value">
                  {popularServices.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ background: 'hsl(0 0% 5%)', border: '1px solid hsl(0 0% 20%)', borderRadius: '8px', color: '#fff' }} />
                <Legend wrapperStyle={{ fontSize: '12px' }} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AnalyticsCharts;

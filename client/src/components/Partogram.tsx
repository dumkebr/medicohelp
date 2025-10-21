import { useState, useRef } from "react";
import { Plus, Trash2, Download, Save, Upload, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface PartogramPoint {
  id: string;
  time: string; // datetime
  hoursFromStart: number;
  dilation: number; // 0-10 cm
  station?: string;
  fhr?: number; // fetal heart rate
  bp?: string; // blood pressure
  notes?: string;
}

interface PartogramData {
  startTime: string;
  points: PartogramPoint[];
  alertDilationStart: number; // cm where alert line starts
  alertRate: number; // cm/hour
  actionOffset: number; // hours offset from alert line
}

const DEFAULT_CONFIG = {
  alertDilationStart: 4,
  alertRate: 1,
  actionOffset: 2,
};

export function Partogram() {
  const { toast } = useToast();
  const chartRef = useRef<HTMLDivElement>(null);

  const [data, setData] = useState<PartogramData>({
    startTime: new Date().toISOString(),
    points: [],
    ...DEFAULT_CONFIG,
  });

  const [newPoint, setNewPoint] = useState({
    time: "",
    dilation: "",
    station: "",
    fhr: "",
    bp: "",
    notes: "",
  });

  const [config, setConfig] = useState(DEFAULT_CONFIG);

  const calculateHoursFromStart = (time: string): number => {
    const start = new Date(data.startTime);
    const current = new Date(time);
    return (current.getTime() - start.getTime()) / (1000 * 60 * 60);
  };

  const addPoint = () => {
    if (!newPoint.time || !newPoint.dilation) {
      toast({
        title: "Campos obrigatórios",
        description: "Preencha hora e dilatação",
        variant: "destructive",
      });
      return;
    }

    const dilation = parseFloat(newPoint.dilation);
    if (isNaN(dilation) || dilation < 0 || dilation > 10) {
      toast({
        title: "Valor inválido",
        description: "Dilatação deve estar entre 0 e 10 cm",
        variant: "destructive",
      });
      return;
    }

    const point: PartogramPoint = {
      id: `point-${Date.now()}`,
      time: newPoint.time,
      hoursFromStart: calculateHoursFromStart(newPoint.time),
      dilation,
      station: newPoint.station || undefined,
      fhr: newPoint.fhr ? parseInt(newPoint.fhr) : undefined,
      bp: newPoint.bp || undefined,
      notes: newPoint.notes || undefined,
    };

    const updatedData = {
      ...data,
      points: [...data.points, point].sort((a, b) => a.hoursFromStart - b.hoursFromStart),
    };
    
    setData(updatedData);
    saveToLocalStorage(updatedData);

    setNewPoint({ time: "", dilation: "", station: "", fhr: "", bp: "", notes: "" });

    toast({
      title: "Ponto adicionado",
      description: `${dilation}cm às ${point.hoursFromStart.toFixed(1)}h`,
    });
  };

  const deletePoint = (id: string) => {
    const updatedData = {
      ...data,
      points: data.points.filter((p) => p.id !== id),
    };
    setData(updatedData);
    saveToLocalStorage(updatedData);

    toast({
      title: "Ponto removido",
    });
  };

  const saveToLocalStorage = (dataToSave: PartogramData) => {
    try {
      localStorage.setItem("partogram_data", JSON.stringify(dataToSave));
    } catch (err) {
      console.error("Failed to save to localStorage", err);
    }
  };

  const loadFromLocalStorage = () => {
    try {
      const saved = localStorage.getItem("partogram_data");
      if (saved) {
        setData(JSON.parse(saved));
        toast({ title: "Dados carregados" });
      } else {
        toast({ title: "Nenhum dado salvo encontrado", variant: "default" });
      }
    } catch (err) {
      toast({ title: "Erro ao carregar dados", variant: "destructive" });
    }
  };

  const exportJSON = () => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `partogram-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: "JSON exportado" });
  };

  const exportPNG = async () => {
    if (!chartRef.current) return;
    try {
      const canvas = await html2canvas(chartRef.current);
      const url = canvas.toDataURL("image/png");
      const a = document.createElement("a");
      a.href = url;
      a.download = `partogram-${new Date().toISOString().slice(0, 10)}.png`;
      a.click();
      toast({ title: "PNG exportado" });
    } catch (err) {
      toast({ title: "Erro ao exportar PNG", variant: "destructive" });
    }
  };

  const exportPDF = async () => {
    if (!chartRef.current) return;
    try {
      const canvas = await html2canvas(chartRef.current);
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("landscape", "mm", "a4");
      const imgWidth = 280;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      pdf.addImage(imgData, "PNG", 10, 10, imgWidth, imgHeight);
      pdf.save(`partogram-${new Date().toISOString().slice(0, 10)}.pdf`);
      toast({ title: "PDF exportado" });
    } catch (err) {
      toast({ title: "Erro ao exportar PDF", variant: "destructive" });
    }
  };

  const applyConfig = () => {
    const updatedData = {
      ...data,
      alertDilationStart: config.alertDilationStart,
      alertRate: config.alertRate,
      actionOffset: config.actionOffset,
    };
    setData(updatedData);
    saveToLocalStorage(updatedData);
    toast({ title: "Configuração aplicada" });
  };

  // Generate alert and action line data
  const maxHours = Math.max(12, ...data.points.map((p) => p.hoursFromStart), 12);
  const alertLineData: any[] = [];
  const actionLineData: any[] = [];

  // Alert line: starts at alertDilationStart, progresses at alertRate cm/h
  const alertStartHour = 0;
  for (let h = alertStartHour; h <= maxHours; h += 0.5) {
    const dilation = data.alertDilationStart + h * data.alertRate;
    if (dilation <= 10) {
      alertLineData.push({ hoursFromStart: h, alert: dilation });
    }
  }

  // Action line: same slope, offset by actionOffset hours
  for (let h = data.actionOffset; h <= maxHours; h += 0.5) {
    const dilation = data.alertDilationStart + (h - data.actionOffset) * data.alertRate;
    if (dilation <= 10) {
      actionLineData.push({ hoursFromStart: h, action: dilation });
    }
  }

  // Combine data for chart
  const chartData: any[] = [];
  const allHours = new Set<number>();
  
  data.points.forEach((p) => allHours.add(p.hoursFromStart));
  alertLineData.forEach((a) => allHours.add(a.hoursFromStart));
  actionLineData.forEach((a) => allHours.add(a.hoursFromStart));

  Array.from(allHours).sort((a, b) => a - b).forEach((h) => {
    const point = data.points.find((p) => p.hoursFromStart === h);
    const alert = alertLineData.find((a) => a.hoursFromStart === h);
    const action = actionLineData.find((a) => a.hoursFromStart === h);

    chartData.push({
      hoursFromStart: h,
      dilation: point?.dilation,
      alert: alert?.alert,
      action: action?.action,
    });
  });

  // Check if patient curve crosses action line
  const crossesActionLine = data.points.some((p) => {
    const expectedAction = data.alertDilationStart + (p.hoursFromStart - data.actionOffset) * data.alertRate;
    return p.hoursFromStart >= data.actionOffset && p.dilation < expectedAction;
  });

  return (
    <div className="space-y-4">
      {/* Disclaimer */}
      <div className="p-3 bg-amber-50 dark:bg-amber-900/20 border-l-4 border-amber-500 rounded-md">
        <p className="text-sm text-amber-800 dark:text-amber-200">
          <strong>Ferramenta de acompanhamento do trabalho de parto.</strong> Use conforme protocolo institucional. Não substitui avaliação clínica contínua.
        </p>
      </div>

      {/* Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Configuração</CardTitle>
          <CardDescription>Parâmetros da linha de alerta e ação</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="alert-start">Início da linha de alerta (cm)</Label>
              <Input
                id="alert-start"
                type="number"
                min="0"
                max="10"
                step="1"
                value={config.alertDilationStart}
                onChange={(e) => setConfig({ ...config, alertDilationStart: parseFloat(e.target.value) })}
                data-testid="input-alert-start"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="alert-rate">Taxa de progressão (cm/h)</Label>
              <Input
                id="alert-rate"
                type="number"
                min="0.1"
                max="5"
                step="0.1"
                value={config.alertRate}
                onChange={(e) => setConfig({ ...config, alertRate: parseFloat(e.target.value) })}
                data-testid="input-alert-rate"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="action-offset">Offset linha de ação (h)</Label>
              <Input
                id="action-offset"
                type="number"
                min="0"
                max="6"
                step="0.5"
                value={config.actionOffset}
                onChange={(e) => setConfig({ ...config, actionOffset: parseFloat(e.target.value) })}
                data-testid="input-action-offset"
              />
            </div>
          </div>
          <Button onClick={applyConfig} size="sm" data-testid="button-apply-config">
            Aplicar Configuração
          </Button>
        </CardContent>
      </Card>

      {/* Add Point */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Adicionar Ponto</CardTitle>
          <CardDescription>Registre a evolução da dilatação</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="time">Hora *</Label>
              <Input
                id="time"
                type="datetime-local"
                value={newPoint.time}
                onChange={(e) => setNewPoint({ ...newPoint, time: e.target.value })}
                data-testid="input-time"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="dilation">Dilatação (cm) *</Label>
              <Input
                id="dilation"
                type="number"
                min="0"
                max="10"
                step="0.5"
                placeholder="0 - 10"
                value={newPoint.dilation}
                onChange={(e) => setNewPoint({ ...newPoint, dilation: e.target.value })}
                data-testid="input-dilation"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="station">Estação</Label>
              <Input
                id="station"
                placeholder="Ex: -2, 0, +1"
                value={newPoint.station}
                onChange={(e) => setNewPoint({ ...newPoint, station: e.target.value })}
                data-testid="input-station"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="fhr">BCF (bpm)</Label>
              <Input
                id="fhr"
                type="number"
                placeholder="Ex: 140"
                value={newPoint.fhr}
                onChange={(e) => setNewPoint({ ...newPoint, fhr: e.target.value })}
                data-testid="input-fhr"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="bp">PA (mmHg)</Label>
              <Input
                id="bp"
                placeholder="Ex: 120/80"
                value={newPoint.bp}
                onChange={(e) => setNewPoint({ ...newPoint, bp: e.target.value })}
                data-testid="input-bp"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="notes">Observações</Label>
              <Input
                id="notes"
                placeholder="Notas adicionais"
                value={newPoint.notes}
                onChange={(e) => setNewPoint({ ...newPoint, notes: e.target.value })}
                data-testid="input-notes"
              />
            </div>
          </div>
          <Button onClick={addPoint} className="gap-2" data-testid="button-add-point">
            <Plus className="w-4 h-4" />
            Adicionar Ponto
          </Button>
        </CardContent>
      </Card>

      {/* Chart */}
      {data.points.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Partograma</span>
              {crossesActionLine && (
                <Badge variant="destructive" className="gap-1">
                  <AlertTriangle className="w-3 h-3" />
                  Atenção
                </Badge>
              )}
            </CardTitle>
            <CardDescription>
              Dilatação cervical × Tempo (início: {new Date(data.startTime).toLocaleString("pt-BR")})
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div ref={chartRef} className="w-full h-[400px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="hoursFromStart" 
                    label={{ value: "Horas desde início", position: "insideBottom", offset: -5 }}
                    domain={[0, maxHours]}
                  />
                  <YAxis 
                    label={{ value: "Dilatação (cm)", angle: -90, position: "insideLeft" }}
                    domain={[0, 10]}
                    ticks={[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10]}
                  />
                  <Tooltip />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="dilation" 
                    stroke="#8884d8" 
                    strokeWidth={3}
                    name="Evolução" 
                    connectNulls
                    dot={{ r: 5 }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="alert" 
                    stroke="#f59e0b" 
                    strokeWidth={2}
                    strokeDasharray="5 5"
                    name="Linha de Alerta" 
                    connectNulls
                    dot={false}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="action" 
                    stroke="#ef4444" 
                    strokeWidth={2}
                    strokeDasharray="5 5"
                    name="Linha de Ação" 
                    connectNulls
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Points Table */}
      {data.points.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Pontos Registrados</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Hora</TableHead>
                  <TableHead>h desde início</TableHead>
                  <TableHead>Dilatação (cm)</TableHead>
                  <TableHead>Estação</TableHead>
                  <TableHead>BCF</TableHead>
                  <TableHead>PA</TableHead>
                  <TableHead>Obs</TableHead>
                  <TableHead className="w-[100px]">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.points.map((point) => (
                  <TableRow key={point.id}>
                    <TableCell>{new Date(point.time).toLocaleString("pt-BR")}</TableCell>
                    <TableCell>{point.hoursFromStart.toFixed(1)}h</TableCell>
                    <TableCell className="font-semibold">{point.dilation} cm</TableCell>
                    <TableCell>{point.station || "-"}</TableCell>
                    <TableCell>{point.fhr || "-"}</TableCell>
                    <TableCell>{point.bp || "-"}</TableCell>
                    <TableCell className="max-w-[200px] truncate">{point.notes || "-"}</TableCell>
                    <TableCell>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => deletePoint(point.id)}
                        data-testid={`button-delete-${point.id}`}
                      >
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Exportar / Salvar</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          <Button onClick={exportJSON} variant="outline" className="gap-2" data-testid="button-export-json">
            <Download className="w-4 h-4" />
            Exportar JSON
          </Button>
          <Button onClick={exportPNG} variant="outline" className="gap-2" data-testid="button-export-png">
            <Download className="w-4 h-4" />
            Exportar PNG
          </Button>
          <Button onClick={exportPDF} variant="outline" className="gap-2" data-testid="button-export-pdf">
            <Download className="w-4 h-4" />
            Exportar PDF
          </Button>
          <Button onClick={loadFromLocalStorage} variant="outline" className="gap-2" data-testid="button-load">
            <Upload className="w-4 h-4" />
            Carregar Dados
          </Button>
          <Button 
            onClick={() => {
              setData({ startTime: new Date().toISOString(), points: [], ...DEFAULT_CONFIG });
              saveToLocalStorage({ startTime: new Date().toISOString(), points: [], ...DEFAULT_CONFIG });
              toast({ title: "Partograma limpo" });
            }}
            variant="outline" 
            className="gap-2"
            data-testid="button-clear"
          >
            <Trash2 className="w-4 h-4" />
            Novo Partograma
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

# Padrão Correto para Shadcn Select

## ⚠️ REGRA CRÍTICA

**NUNCA use `value=""` em `<SelectItem>`**

O Shadcn/Radix Select lança erro quando um `<SelectItem>` tem `value=""` (string vazia).

---

## ✅ Padrão Correto

### 1. Use `value="none"` para representar "vazio"

```tsx
// ❌ ERRADO - Vai quebrar
<SelectItem value="">Sem paciente</SelectItem>

// ✅ CORRETO
<SelectItem value="none">Sem paciente</SelectItem>
```

### 2. Controle com nullish coalescing

```tsx
// Estado: string | null
const [selectedPatientId, setSelectedPatientId] = useState<string>("");

// ✅ CORRETO - Converte null/undefined para "none"
<Select 
  value={selectedPatientId || "none"} 
  onValueChange={(v) => setSelectedPatientId(v === "none" ? "" : v)}
>
  <SelectContent>
    <SelectItem value="none">Sem paciente</SelectItem>
    {patients.map((p) => (
      <SelectItem key={p.id} value={p.id}>
        {p.nome}
      </SelectItem>
    ))}
  </SelectContent>
</Select>
```

### 3. Converter "none" → null no onChange

```tsx
onValueChange={(v) => {
  const newValue = v === "none" ? null : v;
  assignPatient(atendimento.id, newValue);
}}
```

---

## 🔄 Alternativa: Select Nativo

Se preferir evitar o Shadcn Select (mais simples e aceita `value=""`):

```tsx
<select
  value={patientId ?? ""}
  onChange={(e) => {
    const newValue = e.target.value || null;
    assignPatient(atendimento.id, newValue);
  }}
  className="text-sm border rounded px-2 py-1"
>
  <option value="">Sem paciente</option>
  {patients.map(p => (
    <option key={p.id} value={p.id}>
      {p.nome}
    </option>
  ))}
</select>
```

---

## 🔍 Padrões a Evitar

Procure e corrija esses padrões em todo o código:

1. ❌ `<SelectItem value="">`
2. ❌ `<SelectItem value={""}>`
3. ❌ `value={algumaCoisa ?? ""}` dentro de SelectItem

**Lembrete:** No `<Select>` você pode ter `value=""`, mas nos `<SelectItem>` **NUNCA**.

---

## 📍 Implementações no Projeto

### Arquivos Corrigidos:
- ✅ `client/src/pages/atendimento.tsx` (linha 479-497, 530-547)
- ✅ `client/src/components/app-sidebar.tsx` (usa valor direto do paciente)

### Padrão Usado:
```tsx
// Header - Seletor de paciente
<Select 
  value={selectedPatientId || "none"} 
  onValueChange={(v) => handlePatientChange(v === "none" ? "" : v)}
>
  <SelectItem value="none">Sem paciente</SelectItem>
  {/* ... */}
</Select>

// Painel de salvar consulta
<Select 
  value={selectedPatientId || "none"} 
  onValueChange={(v) => setSelectedPatientId(v === "none" ? "" : v)}
>
  <SelectItem value="none">Selecione um paciente</SelectItem>
  {/* ... */}
</Select>
```

---

## 🎯 Checklist de Revisão

Antes de usar um `<Select>` do Shadcn:

- [ ] Verificar se há `<SelectItem value="">`
- [ ] Usar `value="none"` para opção vazia
- [ ] Controlar com `value={campo || "none"}`
- [ ] Converter `"none" → null` no onChange
- [ ] Testar no navegador (não deve haver erros no console)

---

## 📚 Referência

- **Erro comum:** `A <Select.Item /> must have a value prop that is not an empty string`
- **Causa:** Radix UI não permite `value=""` em SelectItem
- **Solução:** Usar sentinel value como `"none"` ou `"__empty__"`

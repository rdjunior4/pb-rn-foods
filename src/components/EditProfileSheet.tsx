import { useState, useEffect } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
  SheetClose,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth, type DocumentType } from "@/lib/auth-context";
import { formatCPF, formatCNPJ, formatPhone } from "@/lib/format";
import { toast } from "sonner";
import { User, Mail, Phone, FileText, Loader2, Save, X } from "lucide-react";

interface EditProfileSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EditProfileSheet({ open, onOpenChange }: EditProfileSheetProps) {
  const { user, updateUser, validateDocument } = useAuth();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [docType, setDocType] = useState<DocumentType>("cpf");
  const [docNumber, setDocNumber] = useState("");
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (user && open) {
      setName(user.name);
      setEmail(user.email);
      setPhone(user.phone || "");
      setDocType(user.documentType);
      setDocNumber(user.document);
      setErrors({});
    }
  }, [user, open]);

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!name.trim()) {
      newErrors.name = "Nome é obrigatório";
    }

    if (!email.trim()) {
      newErrors.email = "E-mail é obrigatório";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = "E-mail inválido";
    }

    const rawDoc = docNumber.replace(/\D/g, "");
    if (docType === "cpf" && rawDoc.length !== 11) {
      newErrors.docNumber = "CPF deve ter 11 dígitos";
    } else if (docType === "cnpj" && rawDoc.length !== 14) {
      newErrors.docNumber = "CNPJ deve ter 14 dígitos";
    } else if (rawDoc.length > 0 && !validateDocument(rawDoc, docType)) {
      newErrors.docNumber = `${docType.toUpperCase()} inválido`;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;

    setSaving(true);

    await updateUser({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      phone: phone.replace(/\D/g, "").length >= 10 ? phone : undefined,
      document: docNumber.replace(/\D/g, ""),
      documentType: docType,
    });

    setSaving(false);
    onOpenChange(false);
    toast.success("Perfil atualizado com sucesso!");
  };

  const handleDocChange = (value: string) => {
    const formatted = docType === "cpf" ? formatCPF(value) : formatCNPJ(value);
    setDocNumber(formatted);
    if (errors.docNumber) {
      setErrors((prev) => ({ ...prev, docNumber: "" }));
    }
  };

  const handleDocTypeChange = (type: DocumentType) => {
    setDocType(type);
    setDocNumber("");
    if (errors.docNumber) {
      setErrors((prev) => ({ ...prev, docNumber: "" }));
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-md">
        <SheetHeader>
          <SheetTitle className="text-xl font-bold">Editar perfil</SheetTitle>
          <SheetDescription>Atualize suas informações pessoais.</SheetDescription>
        </SheetHeader>

        <div className="py-6 space-y-5">
          <div className="space-y-2">
            <Label htmlFor="name" className="text-sm font-medium flex items-center gap-2">
              <User className="h-4 w-4 text-muted-foreground" />
              Nome completo
            </Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (errors.name) setErrors((prev) => ({ ...prev, name: "" }));
              }}
              placeholder="Seu nome"
              className={`h-11 ${errors.name ? "border-destructive focus-visible:ring-destructive/20" : ""}`}
            />
            {errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="email" className="text-sm font-medium flex items-center gap-2">
              <Mail className="h-4 w-4 text-muted-foreground" />
              E-mail
            </Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (errors.email) setErrors((prev) => ({ ...prev, email: "" }));
              }}
              placeholder="seu@email.com"
              className={`h-11 ${errors.email ? "border-destructive focus-visible:ring-destructive/20" : ""}`}
            />
            {errors.email && <p className="text-xs text-destructive">{errors.email}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone" className="text-sm font-medium flex items-center gap-2">
              <Phone className="h-4 w-4 text-muted-foreground" />
              Telefone
            </Label>
            <Input
              id="phone"
              value={phone}
              onChange={(e) => setPhone(formatPhone(e.target.value))}
              placeholder="(00) 00000-0000"
              className="h-11"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium flex items-center gap-2">
              <FileText className="h-4 w-4 text-muted-foreground" />
              Documento
            </Label>
            <div className="grid grid-cols-[100px_1fr] gap-3">
              <select
                value={docType}
                onChange={(e) => handleDocTypeChange(e.target.value as DocumentType)}
                className="h-11 rounded border border-border bg-background pl-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
              >
                <option value="cpf">CPF</option>
                <option value="cnpj">CNPJ</option>
              </select>
              <Input
                value={docNumber}
                onChange={(e) => handleDocChange(e.target.value)}
                placeholder={docType === "cpf" ? "000.000.000-00" : "00.000.000/0000-00"}
                className={`h-11 ${errors.docNumber ? "border-destructive focus-visible:ring-destructive/20" : ""}`}
              />
            </div>
            {errors.docNumber && <p className="text-xs text-destructive">{errors.docNumber}</p>}
          </div>
        </div>

        <SheetFooter className="gap-3">
          <SheetClose asChild>
            <Button variant="outline" className="flex-1">
              <X className="h-4 w-4 mr-2" />
              Cancelar
            </Button>
          </SheetClose>
          <Button onClick={handleSave} disabled={saving} className="flex-1">
            {saving ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            {saving ? "Salvando..." : "Salvar"}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { IoMdEye, IoMdEyeOff } from "react-icons/io";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Info, UploadCloud } from "lucide-react";

const MAX_IMAGE_SIZE_MB = 5;
const MAX_IMAGE_BYTES = MAX_IMAGE_SIZE_MB * 1024 * 1024;

const PHONE_REGEX = /^\(\d{2}\) \d{4,5}-\d{4}$/;
const EMAIL_REGEX = /^\S+@\S+\.\S+$/;
const NAME_REGEX = /^[A-Za-zÀ-ÿ'`\-\s]+$/;
const SPECIALTY_REGEX = /^[A-Za-zÀ-ÿ\s]+$/;
const CEP_REGEX = /^\d{5}-\d{3}$/;

const SPECIALTIES = [
  "Clínica Geral",
  "Cardiologia",
  "Pediatria",
  "Dermatologia",
  "Ginecologia",
  "Obstetrícia",
  "Ortopedia",
  "Neurologia",
  "Psiquiatria",
  "Endocrinologia",
  "Gastroenterologia",
  "Nefrologia",
  "Pneumologia",
  "Oncologia",
  "Reumatologia",
  "Oftalmologia",
  "Otorrinolaringologia",
  "Urologia",
  "Anestesiologia",
  "Hematologia",
  "Infectologia",
  "Nutrologia",
  "Medicina de Família e Comunidade",
];

interface FormSectionProps {
  title: string;
  description?: string;
  children: ReactNode;
}

function FormSection({ title, description, children }: FormSectionProps) {
  return (
    <section className="space-y-4">
      <header className="space-y-1">
        <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
        {description ? <p className="text-sm text-gray-500">{description}</p> : null}
      </header>
      <div className="space-y-5">{children}</div>
    </section>
  );
}

type FormDataState = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  cpf: string;
  day: string;
  month: string;
  year: string;
  crm: string;
  specialty: string;
  about: string;
  password: string;
  confirmPassword: string;
  photo: File | null;
  acceptTerms: boolean;
  clinicName: string;
  clinicAddress: string;
  clinicCity: string;
  clinicZipCode: string;
};

export default function Register() {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [errors, setErrors] = useState<string[]>([]);
const [success, setSuccess] = useState("");
const [photoPreview, setPhotoPreview] = useState<string | null>(null);
const [photoError, setPhotoError] = useState<string | null>(null);
const router = useRouter();

function onlyDigits(value: string) {
  return value.replace(/\D+/g, "");
}

function formatPhone(value: string) {
  const digits = onlyDigits(value).slice(0, 11);
  if (digits.length <= 2) return digits;
  if (digits.length <= 6) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  }
  return `(${digits.slice(0, 2)}) ${digits.slice(2, digits.length - 4)}-${digits.slice(-4)}`;
}

function formatCpf(value: string) {
  const digits = onlyDigits(value).slice(0, 11);
  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `${digits.slice(0, 3)}.${digits.slice(3)}`;
  if (digits.length <= 9)
    return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`;
  return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`;
}

function formatCep(value: string) {
  const digits = onlyDigits(value).slice(0, 8);
  if (digits.length <= 5) return digits;
  return `${digits.slice(0, 5)}-${digits.slice(5)}`;
}

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Não foi possível ler o arquivo de imagem."));
    reader.onabort = () => reject(new Error("A leitura do arquivo foi interrompida."));
    reader.onload = () => {
      const { result } = reader;
      if (typeof result === "string") {
        resolve(result);
        return;
      }
      reject(new Error("Formato de imagem inválido."));
    };
    reader.readAsDataURL(file);
  });
}

function isValidCpf(raw: string) {
  const digits = onlyDigits(raw);
  if (digits.length !== 11 || /^([0-9])\1+$/.test(digits)) return false;
  const calc = (slice: number) => {
    const sum = digits
      .slice(0, slice)
      .split("")
      .reduce((acc, curr, index) => acc + Number(curr) * (slice + 1 - index), 0);
    const mod = (sum * 10) % 11;
    return mod === 10 ? 0 : mod;
  };
  return calc(9) === Number(digits[9]) && calc(10) === Number(digits[10]);
}

function isValidBirthDate(day: string, month: string, year: string) {
  const dayNum = Number(day);
  const monthNum = Number(month);
  const yearNum = Number(year);
  if (!dayNum || !monthNum || !yearNum) return false;
  if (monthNum < 1 || monthNum > 12) return false;
  if (yearNum < 1900) return false;
  const date = new Date(yearNum, monthNum - 1, dayNum);
  if (
    date.getFullYear() !== yearNum ||
    date.getMonth() !== monthNum - 1 ||
    date.getDate() !== dayNum
  ) {
    return false;
  }
  const today = new Date();
  if (date > today) return false;
  let age = today.getFullYear() - yearNum;
  const hasBirthdayPassed =
    today.getMonth() > monthNum - 1 ||
    (today.getMonth() === monthNum - 1 && today.getDate() >= dayNum);
  if (!hasBirthdayPassed) {
    age -= 1;
  }
  const minAge = 18;
  if (age < minAge) return false;
  return true;
}

function passwordIsStrong(password: string) {
  if (password.length < 6) return false;
  const hasUpper = /[A-Z]/.test(password);
  const hasLower = /[a-z]/.test(password);
  const hasNumber = /\d/.test(password);
  const hasSpecial = /[^A-Za-z0-9]/.test(password);
  return hasUpper && hasLower && hasNumber && hasSpecial;
}

  const revokePreview = (url: string | null) => {
    if (url && url.startsWith("blob:")) {
      URL.revokeObjectURL(url);
    }
  };

  useEffect(() => {
    return () => {
      revokePreview(photoPreview);
    };
  }, [photoPreview]);

  const updatePhotoFile = (file: File | null) => {
    revokePreview(photoPreview);
    if (!file) {
      setPhotoPreview(null);
      setFormData((prev) => ({ ...prev, photo: null }));
      setPhotoError(null);
      return;
    }

    if (!file.type.startsWith("image/")) {
      setPhotoError("Envie apenas arquivos de imagem (JPEG, PNG).");
      setFormData((prev) => ({ ...prev, photo: null }));
      return;
    }

    if (file.size > MAX_IMAGE_BYTES) {
      setPhotoError(`A imagem deve ter no máximo ${MAX_IMAGE_SIZE_MB}MB.`);
      setFormData((prev) => ({ ...prev, photo: null }));
      return;
    }

    const previewUrl = URL.createObjectURL(file);
    setPhotoPreview(previewUrl);
    setFormData((prev) => ({ ...prev, photo: file }));
    setPhotoError(null);
  };

  const [formData, setFormData] = useState<FormDataState>({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    cpf: "",
    day: "",
    month: "",
    year: "",
    crm: "",
    specialty: "",
    about: "",
    password: "",
    confirmPassword: "",
    photo: null,
    acceptTerms: false,
    clinicName: "",
    clinicAddress: "",
    clinicCity: "",
    clinicZipCode: "",
  });

  const handleInputChange = (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const element = event.currentTarget;
    const name = element.name as keyof FormDataState | undefined;
    if (!name) return;

    if (element instanceof HTMLInputElement && element.type === "checkbox") {
      setFormData((prev) => ({ ...prev, [name]: element.checked }));
      return;
    }

    let value = element.value;
    switch (name) {
      case "phone":
        value = formatPhone(value);
        break;
      case "cpf":
        value = formatCpf(value);
        break;
      case "clinicZipCode":
        value = formatCep(value);
        break;
      case "crm":
        value = value.toUpperCase();
        break;
      default:
        break;
    }

    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    updatePhotoFile(file);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0] || null;
    updatePhotoFile(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors([]);
    setSuccess("");
    setPhotoError(null);

    const clientErrors: string[] = [];
    const firstName = formData.firstName.trim();
    const lastName = formData.lastName.trim();
    const email = formData.email.trim();
    const phone = formData.phone.trim();
    const cpf = formData.cpf.trim();
    const crm = formData.crm.trim();
    const specialty = formData.specialty.trim();
    const about = formData.about.trim();
    const clinicName = formData.clinicName.trim();
    const clinicAddress = formData.clinicAddress.trim();
    const clinicCity = formData.clinicCity.trim();
    const clinicZip = formData.clinicZipCode.trim();

    if (!firstName) {
      clientErrors.push("Informe seu nome.");
    } else if (!NAME_REGEX.test(firstName)) {
      clientErrors.push("O nome deve conter apenas letras e espaços.");
    }

    if (!lastName) {
      clientErrors.push("Informe seu sobrenome.");
    } else if (!NAME_REGEX.test(lastName)) {
      clientErrors.push("O sobrenome deve conter apenas letras e espaços.");
    }

    if (!email) {
      clientErrors.push("Informe um e-mail profissional.");
    } else if (!EMAIL_REGEX.test(email)) {
      clientErrors.push("Formato de e-mail inválido.");
    }

    if (!phone) {
      clientErrors.push("Informe um telefone para contato.");
    } else if (!PHONE_REGEX.test(phone)) {
      clientErrors.push("Telefone deve estar no formato (11) 91234-5678.");
    }

    if (!cpf) {
      clientErrors.push("Informe o CPF.");
    } else if (!isValidCpf(cpf)) {
      clientErrors.push("CPF inválido.");
    }

    if (!isValidBirthDate(formData.day, formData.month, formData.year)) {
      clientErrors.push("Data de nascimento inválida ou idade mínima não atendida (18 anos).");
    }

    if (!crm) {
      clientErrors.push("Informe o CRM.");
    }

    if (!specialty) {
      clientErrors.push("Informe sua especialidade.");
    } else if (!SPECIALTY_REGEX.test(specialty)) {
      clientErrors.push("A especialidade deve conter apenas letras e espaços.");
    }

    if (!formData.photo) {
      const message = "Envie a foto do profissional antes de finalizar o cadastro.";
      clientErrors.push(message);
      setPhotoError(message);
    }

    if (!about) {
      clientErrors.push("Conte um pouco sobre você.");
    } else if (about.length < 30) {
      clientErrors.push("O texto 'Sobre você' deve ter pelo menos 30 caracteres.");
    } else if (about.length > 1500) {
      clientErrors.push("O texto 'Sobre você' deve ter no máximo 1500 caracteres.");
    }

    if (!clinicName) {
      clientErrors.push("Informe o nome do consultório.");
    }

    if (!clinicAddress) {
      clientErrors.push("Informe a rua e número do consultório.");
    } else if (!/\d/.test(clinicAddress)) {
      clientErrors.push("Inclua o número no endereço do consultório.");
    }

    if (!clinicCity) {
      clientErrors.push("Informe a cidade do consultório.");
    } else if (!NAME_REGEX.test(clinicCity)) {
      clientErrors.push("A cidade deve conter apenas letras.");
    }

    if (!clinicZip) {
      clientErrors.push("Informe o CEP do consultório.");
    } else if (!CEP_REGEX.test(clinicZip)) {
      clientErrors.push("O CEP deve seguir o formato 00000-000.");
    }

    if (!formData.password) {
      clientErrors.push("Informe uma senha.");
    } else if (!passwordIsStrong(formData.password)) {
      clientErrors.push("A senha deve ter ao menos 6 caracteres, incluindo maiúsculas, minúsculas, números e símbolo.");
    }

    if (!formData.confirmPassword) {
      clientErrors.push("Confirme a senha.");
    } else if (formData.password !== formData.confirmPassword) {
      clientErrors.push("As senhas devem ser iguais.");
    }

    if (!formData.acceptTerms) {
      clientErrors.push("É necessário aceitar os termos e condições.");
    }

    if (clientErrors.length) {
      setErrors(clientErrors);
      if (typeof window !== "undefined") {
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
      return;
    }

    const birthDate = `${String(formData.year).padStart(4, "0")}-${String(
      formData.month
    ).padStart(2, "0")}-${String(formData.day).padStart(2, "0")}`;
    const phoneDigits = onlyDigits(formData.phone);
    const cpfDigits = onlyDigits(formData.cpf);
    const postalCodeDigits = onlyDigits(formData.clinicZipCode);

    const photoFile = formData.photo;
    if (!photoFile) {
      // Este bloco não deve ser alcançado devido às validações anteriores, mas garante segurança.
      const message = "Envie a foto do profissional antes de finalizar o cadastro.";
      setErrors([message]);
      setPhotoError(message);
      if (typeof window !== "undefined") {
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
      return;
    }

    let photoUrlString: string;
    try {
      photoUrlString = await readFileAsDataUrl(photoFile);
    } catch (imageError) {
      const message =
        imageError instanceof Error
          ? imageError.message
          : "Não foi possível processar a imagem enviada.";
      setErrors([message]);
      setPhotoError(message);
      if (typeof window !== "undefined") {
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
      return;
    }

    const doctorData = {
      name: `${firstName} ${lastName}`.trim(),
      email,
      password: formData.password,
      confirmPassword: formData.confirmPassword,
      lgpdAccepted: formData.acceptTerms === true,
      crm,
      phone: phoneDigits,
      cpf: cpfDigits,
      birthDate,
      bio: about,
      specialty,
      consultationPrice: 1,
      clinicName,
      streetAndNumber: clinicAddress,
      city: clinicCity,
      postalCode: postalCodeDigits,
      photoUrl: photoUrlString,
    };

    console.log("Enviando cadastro de médico com payload:", doctorData);

    try {
      // Usa o proxy do Next.js para evitar CORS e centralizar o uso de NEXT_PUBLIC_API_BASE_URL no servidor
      const response = await fetch(`/api/registration/doctor`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(doctorData),
      });

      if (!response.ok) {
        const contentType = response.headers.get("content-type") || "";
        const collected: string[] = [`Erro ao enviar cadastro (HTTP ${response.status})`];
        if (contentType.includes("application/json")) {
          try {
            const data = await response.json();
            if (data?.message) collected.push(String(data.message));
            if (data?.error) collected.push(String(data.error));
            if (Array.isArray(data?.errors)) {
              for (const e of data.errors) {
                if (!e) continue;
                const item = e.message || e.field || JSON.stringify(e);
                if (item) collected.push(String(item));
              }
            }
            if (Array.isArray(data?.violations)) {
              for (const v of data.violations) {
                const item = [v?.field, v?.message].filter(Boolean).join(": ");
                if (item) collected.push(item);
              }
            }
            if (data?.details) collected.push(String(data.details));
          } catch {
            // ignore JSON parse errors
          }
        } else {
          const text = await response.text();
          if (text) collected.push(text);
        }
        console.error("Falha ao enviar cadastro de médico:", collected);
        setErrors(collected);
        if (typeof window !== "undefined") {
          window.scrollTo({ top: 0, behavior: "smooth" });
        }
        return;
      }

      console.log("Cadastro de médico enviado com sucesso");
      // Mostra mensagem de sucesso e rola para o topo
      setSuccess("Cadastro realizado com sucesso! Você será redirecionado.");
      if (typeof window !== "undefined") {
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
      updatePhotoFile(null);
      // Redireciona para login do médico após breve pausa
      setTimeout(() => router.push("/medicos/login-medico"), 1000);
    } catch (err: unknown) {
      const message =
        err instanceof Error
          ? err.message
          : "Ocorreu um erro ao enviar o cadastro.";
      setErrors([message]);
      if (typeof window !== "undefined") {
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
      console.error("Falha ao enviar cadastro de médico:", err);
    }
  };

  const previewImage = photoPreview;

  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-white to-[#F5F6FA]">
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="space-y-10">
          <header className="space-y-3 text-center sm:text-left">
            <span className="inline-flex items-center gap-2 rounded-full border border-[#5179EF]/20 bg-[#5179EF]/5 px-4 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-[#5179EF]">
              Cadastro de médicos
            </span>
            <h1 className="text-3xl font-semibold text-gray-900">
              Construa seu espaço no Pass+
            </h1>
            <p className="text-sm text-gray-600 sm:max-w-2xl">
              Reúna seus dados profissionais e de consultório em poucos passos para habilitar o agendamento de consultas pelo Pass+.
            </p>
          </header>

          <div className="overflow-hidden rounded-3xl border border-gray-100 bg-white/95 shadow-xl backdrop-blur">
            <div className="px-6 py-8 sm:px-10 sm:py-10">
              <div className="space-y-6">
                {errors.length > 0 && (
                  <div className="rounded-2xl border border-rose-100 bg-rose-50/80 p-4 text-sm text-rose-600">
                    <p className="font-medium">Corrija os seguintes pontos:</p>
                    <ul className="mt-2 space-y-1 list-disc list-inside">
                      {errors.map((err, idx) => (
                        <li key={idx}>{err}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {success && (
                  <div className="rounded-2xl border border-emerald-100 bg-emerald-50/80 p-4 text-sm text-emerald-600">
                    {success}
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-10">
                  <FormSection
                    title="Informações pessoais"
                    description="Apresente seus dados básicos e contatos para que possamos ajudar seus pacientes a encontrá-lo."
                  >
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-1.5">
                        <Label htmlFor="firstName" className="text-xs font-medium uppercase tracking-wide text-gray-600">
                          Nome
                        </Label>
                        <Input
                          id="firstName"
                          name="firstName"
                          type="text"
                          value={formData.firstName}
                          onChange={handleInputChange}
                          placeholder="Nome"
                          className="h-11"
                          required
                          autoComplete="given-name"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="lastName" className="text-xs font-medium uppercase tracking-wide text-gray-600">
                          Sobrenome
                        </Label>
                        <Input
                          id="lastName"
                          name="lastName"
                          type="text"
                          value={formData.lastName}
                          onChange={handleInputChange}
                          placeholder="Sobrenome"
                          className="h-11"
                          required
                          autoComplete="family-name"
                        />
                      </div>
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-1.5">
                        <Label htmlFor="email" className="text-xs font-medium uppercase tracking-wide text-gray-600">
                          E-mail profissional
                        </Label>
                        <Input
                          id="email"
                          name="email"
                          type="email"
                          value={formData.email}
                          onChange={handleInputChange}
                          placeholder="ex: meuemail@exemplo.com"
                          className="h-11"
                          autoComplete="email"
                          required
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="phone" className="text-xs font-medium uppercase tracking-wide text-gray-600">
                          Telefone
                        </Label>
                        <Input
                          id="phone"
                          name="phone"
                          type="text"
                          value={formData.phone}
                          onChange={handleInputChange}
                          placeholder="(11) 91234-5678"
                          className="h-11"
                          autoComplete="tel"
                          required
                        />
                      </div>
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-1.5">
                        <Label htmlFor="cpf" className="text-xs font-medium uppercase tracking-wide text-gray-600">
                          CPF
                        </Label>
                        <Input
                          id="cpf"
                          name="cpf"
                          type="text"
                          value={formData.cpf}
                          onChange={handleInputChange}
                          placeholder="123.456.789-00"
                          className="h-11"
                          autoComplete="off"
                          required
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs font-medium uppercase tracking-wide text-gray-600">
                          Data de nascimento
                        </Label>
                        <div className="grid grid-cols-3 gap-3">
                          <Input
                            id="day"
                            name="day"
                            type="number"
                            value={formData.day}
                            onChange={handleInputChange}
                            placeholder="Dia"
                            className="h-11"
                            autoComplete="bday-day"
                            required
                          />
                          <Input
                            id="month"
                            name="month"
                            type="number"
                            value={formData.month}
                            onChange={handleInputChange}
                            placeholder="Mês"
                            className="h-11"
                            autoComplete="bday-month"
                            required
                          />
                          <Input
                            id="year"
                            name="year"
                            type="number"
                            value={formData.year}
                            onChange={handleInputChange}
                            placeholder="Ano"
                            className="h-11"
                            autoComplete="bday-year"
                            required
                          />
                        </div>
                      </div>
                    </div>
                  </FormSection>

                  <FormSection
                    title="Perfil profissional"
                    description="Compartilhe sua imagem, registros e a especialidade que deseja divulgar."
                  >
                    <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)]">
                      <div
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={handleDrop}
                        onClick={() => fileInputRef.current?.click()}
                        className={`flex flex-col items-center justify-center rounded-2xl border border-dashed text-center transition-colors ${
                          photoError
                            ? "border-rose-300 bg-rose-50/70 hover:bg-rose-100"
                            : "border-gray-300 bg-gray-50/80 hover:bg-gray-100"
                        } p-6 sm:p-8 cursor-pointer`}
                      >
                        <UploadCloud className="text-gray-400" size={28} />
                        <p className="mt-3 text-sm font-medium text-gray-700">Envie uma foto</p>
                        <p className="text-xs text-gray-500">Arraste e solte ou clique para selecionar um arquivo</p>
                        {formData.photo && (
                          <p className="mt-3 text-xs text-gray-600">Selecionado: {formData.photo.name}</p>
                        )}
                        {previewImage && (
                          <div className="mt-4">
                            <Image
                              src={previewImage}
                              alt="Pré-visualização da foto do profissional"
                              width={72}
                              height={72}
                              unoptimized
                              className="h-[72px] w-[72px] rounded-full object-cover border border-gray-200"
                            />
                          </div>
                        )}
                        <input
                          ref={fileInputRef}
                          id="picture"
                          name="picture"
                          type="file"
                          accept="image/*"
                          onChange={handleFileChange}
                          className="hidden"
                          required
                        />
                      </div>
                      {photoError ? (
                        <p className="text-xs text-rose-600">{photoError}</p>
                      ) : (
                        <p className="text-xs text-gray-500">
                          Esta foto será exibida no agendamento para transmitir confiança aos seus pacientes.
                        </p>
                      )}
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-1.5">
                        <Label htmlFor="crm" className="text-xs font-medium uppercase tracking-wide text-gray-600">
                          CRM
                        </Label>
                        <Input
                          id="crm"
                          name="crm"
                          type="text"
                          value={formData.crm}
                          onChange={handleInputChange}
                          placeholder="CRM/SP 123456"
                          className="h-11"
                          autoComplete="off"
                          required
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="specialty" className="text-xs font-medium uppercase tracking-wide text-gray-600">
                          Especialidade
                        </Label>
                        <div className="space-y-1">
                          <Input
                            id="specialty"
                            name="specialty"
                            type="text"
                            value={formData.specialty}
                            onChange={handleInputChange}
                            placeholder="Ex: Cardiologia"
                            className="h-11"
                            list="specialties"
                            autoComplete="off"
                            required
                          />
                          <datalist id="specialties">
                            {SPECIALTIES.map((s) => (
                              <option key={s} value={s} />
                            ))}
                          </datalist>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="about" className="text-xs font-medium uppercase tracking-wide text-gray-600">
                        Sobre você
                      </Label>
                      <textarea
                        id="about"
                        name="about"
                        value={formData.about}
                        onChange={handleInputChange}
                        placeholder="Fale sobre sua formação, experiências e abordagens de cuidado."
                        className="min-h-[120px] w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-[#5179EF] focus:ring-2 focus:ring-[#5179EF]/20"
                      />
                    </div>
                  </FormSection>

                  <FormSection
                    title="Consultório principal"
                    description="Informe onde os pacientes serão atendidos presencialmente."
                  >
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-1.5">
                        <Label htmlFor="clinicName" className="text-xs font-medium uppercase tracking-wide text-gray-600">
                          Nome do consultório
                        </Label>
                        <Input
                          id="clinicName"
                          name="clinicName"
                          type="text"
                          value={formData.clinicName}
                          onChange={handleInputChange}
                          className="h-11"
                          autoComplete="organization"
                          required
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="clinicAddress" className="text-xs font-medium uppercase tracking-wide text-gray-600">
                          Rua e número
                        </Label>
                        <Input
                          id="clinicAddress"
                          name="clinicAddress"
                          type="text"
                          value={formData.clinicAddress}
                          onChange={handleInputChange}
                          className="h-11"
                          autoComplete="street-address"
                          required
                        />
                      </div>
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-1.5">
                        <Label htmlFor="clinicCity" className="text-xs font-medium uppercase tracking-wide text-gray-600">
                          Cidade
                        </Label>
                        <Input
                          id="clinicCity"
                          name="clinicCity"
                          type="text"
                          value={formData.clinicCity}
                          onChange={handleInputChange}
                          className="h-11"
                          autoComplete="address-level2"
                          required
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="clinicZipCode" className="text-xs font-medium uppercase tracking-wide text-gray-600">
                          CEP
                        </Label>
                        <Input
                          id="clinicZipCode"
                          name="clinicZipCode"
                          type="text"
                          value={formData.clinicZipCode}
                          onChange={handleInputChange}
                          className="h-11"
                          autoComplete="postal-code"
                          required
                        />
                      </div>
                    </div>
                    <div className="flex items-start gap-2 rounded-xl bg-gray-50 px-4 py-3 text-sm text-gray-600">
                      <Info className="h-4 w-4 text-[#5179EF]" />
                      <span>Você poderá adicionar outros endereços depois de ativar sua conta.</span>
                    </div>
                  </FormSection>

                  <FormSection
                    title="Acesso à plataforma"
                    description="Defina uma senha segura para proteger o seu painel."
                  >
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-1.5">
                        <Label htmlFor="password" className="text-xs font-medium uppercase tracking-wide text-gray-600">
                          Senha
                        </Label>
                        <div className="relative">
                          <Input
                            id="password"
                            name="password"
                            type={showPassword ? "text" : "password"}
                            value={formData.password}
                            onChange={handleInputChange}
                            placeholder="Crie sua senha"
                            className="h-11 pr-10"
                            autoComplete="new-password"
                            required
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword((s) => !s)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                          >
                            {showPassword ? <IoMdEye size={20} /> : <IoMdEyeOff size={20} />}
                          </button>
                        </div>
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="confirmPassword" className="text-xs font-medium uppercase tracking-wide text-gray-600">
                          Confirmar senha
                        </Label>
                        <div className="relative">
                          <Input
                            id="confirmPassword"
                            name="confirmPassword"
                            type={showConfirmPassword ? "text" : "password"}
                            value={formData.confirmPassword}
                            onChange={handleInputChange}
                            placeholder="Confirme sua senha"
                            className="h-11 pr-10"
                            autoComplete="new-password"
                            required
                          />
                          <button
                            type="button"
                            onClick={() => setShowConfirmPassword((s) => !s)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                          >
                            {showConfirmPassword ? <IoMdEye size={20} /> : <IoMdEyeOff size={20} />}
                          </button>
                        </div>
                      </div>
                    </div>
                  </FormSection>

                  <div className="space-y-6">
                    <div className="flex items-start gap-3 rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3">
                      <input
                        type="checkbox"
                        id="acceptTerms"
                        name="acceptTerms"
                        className="mt-1 h-4 w-4 rounded border-gray-300 text-[#5179EF] focus:ring-[#5179EF]"
                        checked={formData.acceptTerms}
                        onChange={handleInputChange}
                      />
                      <label htmlFor="acceptTerms" className="text-sm text-gray-600">
                        Ao continuar, confirmo que li e concordo com os {" "}
                        <Link href="/termos" className="font-medium text-[#5179EF] hover:text-[#3356b3]">
                          Termos e condições
                        </Link>{" "}
                        e com a {" "}
                        <Link href="/privacidade" className="font-medium text-[#5179EF] hover:text-[#3356b3]">
                          Política de privacidade
                        </Link>
                        .
                      </label>
                    </div>

                    <button
                      type="submit"
                      className="w-full rounded-xl bg-[#5179EF] py-3 text-sm font-semibold text-white transition hover:bg-[#3a63e0] focus:outline-none focus:ring-2 focus:ring-[#5179EF]/40 active:translate-y-[1px]"
                    >
                      Enviar cadastro para análise
                    </button>

                    <div className="text-center text-sm text-gray-500">
                      <p>Já possui cadastro?</p>
                      <div className="mt-2 flex flex-col gap-1 sm:flex-row sm:justify-center sm:gap-4">
                        <Link href="/medicos/login-medico" className="font-medium text-[#5179EF] hover:text-[#3356b3]">
                          Acessar conta de médico
                        </Link>
                        <Link href="/register" className="font-medium text-[#5179EF] hover:text-[#3356b3]">
                          Sou paciente e quero me cadastrar
                        </Link>
                      </div>
                    </div>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

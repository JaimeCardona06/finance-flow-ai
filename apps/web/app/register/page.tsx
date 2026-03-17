'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { userRegistrationSchema, type UserRegistration } from '@financeflow/shared';

export default function RegisterPage() {
  const router = useRouter();
  const [formData, setFormData] = useState<UserRegistration>({
    name: '',
    email: '',
    password: '',
    consentAccepted: false
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [serverError, setServerError] = useState<string>('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    // Limpiar error del campo al editar
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setServerError('');

    // Validar con Zod
    const validation = userRegistrationSchema.safeParse(formData);

    if (!validation.success) {
      const fieldErrors: Record<string, string> = {};
      validation.error.errors.forEach((err) => {
        const field = err.path[0] as string;
        fieldErrors[field] = err.message;
      });
      setErrors(fieldErrors);
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('http://localhost:4000/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.error?.code === 'USER_ALREADY_EXISTS') {
          setServerError('Ya existe una cuenta con este email');
        } else if (data.error?.details) {
          const fieldErrors: Record<string, string> = {};
          data.error.details.forEach((detail: any) => {
            fieldErrors[detail.field] = detail.message;
          });
          setErrors(fieldErrors);
        } else {
          setServerError(data.error?.message || 'Error al registrar usuario');
        }
        return;
      }

      // Registro exitoso
      alert('¡Registro exitoso! Usuario creado correctamente.');
      
      // Redirigir al login o dashboard (por ahora solo mostramos mensaje)
      router.push('/');

    } catch (error) {
      console.error('Error:', error);
      setServerError('Error de conexión con el servidor');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Crear cuenta en FinanceFlow AI
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Descubre dónde se va tu dinero sin darte cuenta
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {serverError && (
            <div className="rounded-md bg-red-50 p-4">
              <p className="text-sm text-red-800">{serverError}</p>
            </div>
          )}

          <div className="rounded-md shadow-sm space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                Nombre completo
              </label>
              <input
                id="name"
                name="name"
                type="text"
                required
                value={formData.name}
                onChange={handleChange}
                className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                placeholder="Juan Pérez"
              />
              {errors.name && (
                <p className="mt-1 text-sm text-red-600">{errors.name}</p>
              )}
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                value={formData.email}
                onChange={handleChange}
                className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                placeholder="tu@email.com"
              />
              {errors.email && (
                <p className="mt-1 text-sm text-red-600">{errors.email}</p>
              )}
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Contraseña
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                value={formData.password}
                onChange={handleChange}
                className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                placeholder="Mínimo 8 caracteres"
              />
              {errors.password && (
                <p className="mt-1 text-sm text-red-600">{errors.password}</p>
              )}
            </div>
          </div>

          <div className="flex items-start">
            <div className="flex items-center h-5">
              <input
                id="consentAccepted"
                name="consentAccepted"
                type="checkbox"
                checked={formData.consentAccepted}
                onChange={handleChange}
                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
              />
            </div>
            <div className="ml-3 text-sm">
              <label htmlFor="consentAccepted" className="font-medium text-gray-700">
                Acepto la política de privacidad y el tratamiento de mis datos personales
              </label>
              <p className="text-gray-500 mt-1">
                De acuerdo con la Ley 1581 de 2012, autorizo el tratamiento de mis datos financieros 
                para análisis de gastos hormiga. Puedes consultar nuestra{' '}
                <a href="/privacy" className="text-indigo-600 hover:text-indigo-500">
                  política de privacidad completa
                </a>.
              </p>
              {errors.consentAccepted && (
                <p className="mt-1 text-sm text-red-600">{errors.consentAccepted}</p>
              )}
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Registrando...' : 'Crear cuenta'}
            </button>
          </div>

          <div className="text-center">
            <p className="text-sm text-gray-600">
              ¿Ya tienes cuenta?{' '}
              <Link href="/login" className="font-medium text-indigo-600 hover:text-indigo-500">
                Inicia sesión
              </Link>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}

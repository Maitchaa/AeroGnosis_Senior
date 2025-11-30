import { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';

interface CreateAccountForm {
  fullName: string;
  email: string;
  username: string;
  password: string;
  confirmPassword: string;
  employeeId: string;
  department: string;
}

interface CreateAccountProps {
  onSubmit: (data: {
    fullName: string;
    email: string;
    password: string;
    employeeId: string;
    department: string;
  }) => Promise<void>;
  onBackToLogin: () => void;
  isSubmitting?: boolean;
  errorMessage?: string | null;
}

const initialForm: CreateAccountForm = {
  fullName: '',
  email: '',
  username: '',
  password: '',
  confirmPassword: '',
  employeeId: '',
  department: '',
};

export function CreateAccount({ onSubmit, onBackToLogin, isSubmitting, errorMessage }: CreateAccountProps) {
  const [formData, setFormData] = useState<CreateAccountForm>(initialForm);
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formMessage, setFormMessage] = useState<string | null>(null);

  const validateForm = () => {
    const nextErrors: Record<string, string> = {};

    if (!formData.fullName.trim()) {
      nextErrors.fullName = 'Full name is required';
    }

    if (!formData.email.trim()) {
      nextErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      nextErrors.email = 'Invalid email format';
    }

    if (!formData.password) {
      nextErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      nextErrors.password = 'Password must be at least 6 characters';
    }

    if (formData.password !== formData.confirmPassword) {
      nextErrors.confirmPassword = 'Passwords do not match';
    }

    if (!formData.employeeId.trim()) {
      nextErrors.employeeId = 'Employee ID is required';
    }

    if (!formData.department) {
      nextErrors.department = 'Department is required';
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleChange = (field: keyof CreateAccountForm, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));

    if (errors[field]) {
      setErrors((prev) => {
        const { [field]: _removed, ...rest } = prev;
        return rest;
      });
    }

    setFormMessage(null);
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      await onSubmit({
        fullName: formData.fullName.trim(),
        email: formData.email.trim(),
        password: formData.password,
        employeeId: formData.employeeId.trim(),
        department: formData.department,
      });
      setFormMessage('Account created successfully. You will be redirected shortly.');
    } catch (err) {
      if (err instanceof Error && err.name === 'FirebaseError') {
        return;
      }
    }
  };

  const helperMessage = formMessage ?? errorMessage ?? null;

  return (
    <div className="min-h-screen bg-[#2d3748] flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        <div className="text-center mb-8">
          <h1 className="text-4xl text-white mb-2">
            <span className="text-[#60a5fa]">Aero</span>Gnosis
          </h1>
          <p className="text-[#94a3b8]">Create Your Account</p>
        </div>

        <div className="bg-[#1e2837] rounded-2xl p-8 shadow-xl">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="fullName" className="text-white">
                Full Name
              </Label>
              <Input
                id="fullName"
                type="text"
                placeholder="Enter your full name"
                value={formData.fullName}
                onChange={(event) => handleChange('fullName', event.target.value)}
                className="bg-[#2d3748] border-gray-600 text-white"
                autoComplete="name"
              />
              {errors.fullName && <p className="text-red-500 text-sm">{errors.fullName}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="text-white">
                Email Address
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="engineer@aerognosis.com"
                value={formData.email}
                onChange={(event) => handleChange('email', event.target.value)}
                className="bg-[#2d3748] border-gray-600 text-white"
                autoComplete="email"
              />
              {errors.email && <p className="text-red-500 text-sm">{errors.email}</p>}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="username" className="text-white">
                  Username (optional)
                </Label>
                <Input
                  id="username"
                  type="text"
                  placeholder="Choose username"
                  value={formData.username}
                  onChange={(event) => handleChange('username', event.target.value)}
                  className="bg-[#2d3748] border-gray-600 text-white"
                  autoComplete="username"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="employeeId" className="text-white">
                  Employee ID
                </Label>
                <Input
                  id="employeeId"
                  type="text"
                  placeholder="EMP-2024-XXXX"
                  value={formData.employeeId}
                  onChange={(event) => handleChange('employeeId', event.target.value)}
                  className="bg-[#2d3748] border-gray-600 text-white"
                  autoComplete="off"
                />
                {errors.employeeId && <p className="text-red-500 text-sm">{errors.employeeId}</p>}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="department" className="text-white">
                Department
              </Label>
              <select
                id="department"
                value={formData.department}
                onChange={(event) => handleChange('department', event.target.value)}
                className="w-full bg-[#2d3748] border border-gray-600 text-white rounded-lg px-3 py-2"
              >
                <option value="">Select department</option>
                <option value="line-maintenance">Line Maintenance</option>
                <option value="heavy-maintenance">Heavy Maintenance</option>
                <option value="avionics">Avionics</option>
                <option value="powerplant">Powerplant</option>
                <option value="structures">Structures</option>
                <option value="quality-control">Quality Control</option>
              </select>
              {errors.department && <p className="text-red-500 text-sm">{errors.department}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-white">
                Password
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Create password (min. 6 characters)"
                  value={formData.password}
                  onChange={(event) => handleChange('password', event.target.value)}
                  className="bg-[#2d3748] border-gray-600 text-white pr-12"
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((value) => !value)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
                >
                  {showPassword ? (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
                      />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                      />
                    </svg>
                  )}
                </button>
              </div>
              {errors.password && <p className="text-red-500 text-sm">{errors.password}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="text-white">
                Confirm Password
              </Label>
              <Input
                id="confirmPassword"
                type={showPassword ? 'text' : 'password'}
                placeholder="Confirm your password"
                value={formData.confirmPassword}
                onChange={(event) => handleChange('confirmPassword', event.target.value)}
                className="bg-[#2d3748] border-gray-600 text-white"
                autoComplete="new-password"
              />
              {errors.confirmPassword && <p className="text-red-500 text-sm">{errors.confirmPassword}</p>}
            </div>

            {helperMessage && <p className="text-sm text-[#60a5fa] text-center">{helperMessage}</p>}

            <Button
              type="submit"
              className="w-full bg-[#60a5fa] hover:bg-[#3b82f6] text-white h-12 rounded-xl"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Creating account…' : 'Create Account'}
            </Button>
          </form>
        </div>

        <div className="text-center mt-6">
          <button onClick={onBackToLogin} className="text-white hover:text-[#60a5fa] transition-colors">
            Back to Login
          </button>
        </div>
      </div>
    </div>
  );
}

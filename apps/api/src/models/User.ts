import mongoose, { Document, Schema } from 'mongoose';
import bcrypt from 'bcrypt';

/**
 * Interface para el documento de Usuario en MongoDB
 */
export interface IUser extends Document {
  name: string;
  email: string;
  password: string;
  acceptedPrivacyPolicy: boolean;
  privacyPolicyAcceptedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
}

/**
 * Schema de Usuario con validaciones
 */
const userSchema = new Schema<IUser>(
  {
    name: {
      type: String,
      required: [true, 'El nombre es requerido'],
      trim: true,
      minlength: [2, 'El nombre debe tener al menos 2 caracteres'],
      maxlength: [100, 'El nombre no puede exceder 100 caracteres']
    },
    email: {
      type: String,
      required: [true, 'El email es requerido'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Email inválido']
    },
    password: {
      type: String,
      required: [true, 'La contraseña es requerida'],
      minlength: [8, 'La contraseña debe tener al menos 8 caracteres']
    },
    acceptedPrivacyPolicy: {
      type: Boolean,
      required: [true, 'Debes aceptar la política de privacidad'],
      validate: {
        validator: (value: boolean) => value === true,
        message: 'Debes aceptar la política de privacidad para continuar'
      }
    },
    privacyPolicyAcceptedAt: {
      type: Date,
      default: null
    }
  },
  {
    timestamps: true,
    collection: 'users'
  }
);

/**
 * Middleware: Hashear password antes de guardar
 */
userSchema.pre('save', async function (next) {
  // Solo hashear si el password fue modificado
  if (!this.isModified('password')) {
    return next();
  }

  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error as Error);
  }
});

/**
 * Middleware: Establecer fecha de aceptación de política si se acepta
 */
userSchema.pre('save', function (next) {
  if (this.acceptedPrivacyPolicy && !this.privacyPolicyAcceptedAt) {
    this.privacyPolicyAcceptedAt = new Date();
  }
  next();
});

/**
 * Método: Comparar password
 */
userSchema.methods.comparePassword = async function (
  candidatePassword: string
): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.password);
};

/**
 * Índices para optimizar queries
 */
userSchema.index({ email: 1 });

/**
 * Modelo de Usuario
 */
export const User = mongoose.model<IUser>('User', userSchema);

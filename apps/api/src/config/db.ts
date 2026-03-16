import mongoose from 'mongoose';

/**
 * Configuración de conexión a MongoDB Atlas
 */
export async function connectDB(): Promise<void> {
  try {
    const mongoUri = process.env.MONGODB_URI;

    if (!mongoUri) {
      throw new Error('MONGODB_URI no está definida en las variables de entorno');
    }

    await mongoose.connect(mongoUri);

    console.log('✅ MongoDB Atlas conectado exitosamente');

    // Event listeners para monitoreo
    mongoose.connection.on('error', (error) => {
      console.error('❌ Error de conexión a MongoDB:', error);
    });

    mongoose.connection.on('disconnected', () => {
      console.warn('⚠️  MongoDB desconectado');
    });

  } catch (error) {
    console.error('❌ Error al conectar a MongoDB:', error);
    process.exit(1);
  }
}

/**
 * Cerrar conexión a MongoDB (útil para tests y shutdown graceful)
 */
export async function disconnectDB(): Promise<void> {
  try {
    await mongoose.connection.close();
    console.log('✅ MongoDB desconectado correctamente');
  } catch (error) {
    console.error('❌ Error al desconectar MongoDB:', error);
  }
}

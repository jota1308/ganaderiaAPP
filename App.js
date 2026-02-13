import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_URL = 'http://localhost:3001/api';

// Formato de fecha: día/mes/año (dd/mm/yyyy)
const formatearFecha = (fecha) => {
  if (!fecha) return '—';
  const s = String(fecha).trim();
  const part = s.split(/[-T]/);
  if (part.length >= 3) {
    const [y, m, d] = part;
    return `${d.padStart(2, '0')}/${m.padStart(2, '0')}/${y}`;
  }
  return s;
};

// ==================== PANTALLA DE LOGIN ====================
const LoginScreen = ({ onLogin }) => {
  const [email, setEmail] = useState('demo@campo.com');
  const [password, setPassword] = useState('demo123');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (response.ok) {
        await AsyncStorage.setItem('token', data.token);
        await AsyncStorage.setItem('usuario', JSON.stringify(data.usuario));
        onLogin(data.token, data.usuario);
      } else {
        Alert.alert('Error', data.error || 'Credenciales inválidas');
      }
    } catch (error) {
      Alert.alert('Error', 'No se pudo conectar al servidor');
    }
    setLoading(false);
  };

  return (
    <View style={styles.container}>
      <View style={styles.loginCard}>
        <Text style={styles.logo}>🐄 GanaderoApp</Text>
        <Text style={styles.subtitle}>Sistema de Tracking Ganadero</Text>

        <TextInput
          style={styles.input}
          placeholder="Email"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
        />

        <TextInput
          style={styles.input}
          placeholder="Contraseña"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />

        <TouchableOpacity
          style={styles.button}
          onPress={handleLogin}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Ingresar</Text>
          )}
        </TouchableOpacity>

        <Text style={styles.demoInfo}>
          Demo: demo@campo.com / demo123
        </Text>
      </View>
    </View>
  );
};

// ==================== PANTALLA PRINCIPAL ====================
const MainScreen = ({ token, usuario, onLogout }) => {
  const [screen, setScreen] = useState('home');
  const [animales, setAnimales] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (screen === 'home') {
      cargarAnimales();
    }
  }, [screen]);

  const cargarAnimales = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/animales`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      setAnimales(data);
    } catch (error) {
      Alert.alert('Error', 'No se pudieron cargar los animales');
    }
    setLoading(false);
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>🐄 {usuario.nombre_campo}</Text>
          <Text style={styles.headerSubtitle}>{usuario.email}</Text>
        </View>
        <TouchableOpacity onPress={onLogout}>
          <Text style={styles.logoutButton}>Salir</Text>
        </TouchableOpacity>
      </View>

      {/* Contenido */}
      {screen === 'home' && (
        <HomeScreen
          animales={animales}
          loading={loading}
          onRefresh={cargarAnimales}
          onScan={() => setScreen('scan')}
          token={token}
        />
      )}

      {screen === 'scan' && (
        <ScanScreen
          token={token}
          onBack={() => setScreen('home')}
        />
      )}

      {/* Bottom Navigation */}
      <View style={styles.bottomNav}>
        <TouchableOpacity
          style={styles.navButton}
          onPress={() => setScreen('home')}
        >
          <Text style={styles.navIcon}>🏠</Text>
          <Text style={[styles.navText, screen === 'home' && styles.navTextActive]}>
            Inicio
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.navButton}
          onPress={() => setScreen('scan')}
        >
          <Text style={styles.navIcon}>📷</Text>
          <Text style={[styles.navText, screen === 'scan' && styles.navTextActive]}>
            Escanear
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

// ==================== PANTALLA HOME ====================
const HomeScreen = ({ animales, loading, onRefresh, onScan, token }) => {
  return (
    <View style={styles.content}>
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{animales.length}</Text>
          <Text style={styles.statLabel}>Animales</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>
            {animales.filter(a => a.sexo === 'hembra').length}
          </Text>
          <Text style={styles.statLabel}>Hembras</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>
            {animales.filter(a => a.sexo === 'macho').length}
          </Text>
          <Text style={styles.statLabel}>Machos</Text>
        </View>
      </View>

      <TouchableOpacity style={styles.scanButton} onPress={onScan}>
        <Text style={styles.scanButtonText}>📷 Escanear Caravana</Text>
      </TouchableOpacity>

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Mis Animales</Text>
        <TouchableOpacity onPress={onRefresh}>
          <Text style={styles.refreshButton}>🔄</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#2E7D32" style={{ marginTop: 20 }} />
      ) : (
        <ScrollView style={styles.animalList}>
          {animales.map((animal) => (
            <AnimalCard key={animal.id} animal={animal} token={token} />
          ))}
        </ScrollView>
      )}
    </View>
  );
};

// ==================== TARJETA DE ANIMAL ====================
const AnimalCard = ({ animal, token }) => {
  const [expanded, setExpanded] = useState(false);
  const [detalle, setDetalle] = useState(null);

  const cargarDetalle = async () => {
    if (!expanded) {
      try {
        const response = await fetch(
          `${API_URL}/animales/caravana/${animal.caravana}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        const data = await response.json();
        setDetalle(data);
      } catch (error) {
        Alert.alert('Error', 'No se pudo cargar el detalle');
      }
    }
    setExpanded(!expanded);
  };

  const calcularGananciaDiaria = () => {
    if (!detalle) return null;
    const puntos = [];
    if (detalle.peso_nacimiento != null && detalle.fecha_nacimiento) {
      puntos.push({ fecha: detalle.fecha_nacimiento, peso: parseFloat(detalle.peso_nacimiento) });
    }
    if (detalle.pesajes && detalle.pesajes.length > 0) {
      puntos.push(...detalle.pesajes.map(p => ({ fecha: p.fecha, peso: p.peso })));
    }
    puntos.sort((a, b) => a.fecha.localeCompare(b.fecha));
    if (puntos.length < 2) return null;

    const ultimo = puntos[puntos.length - 1];
    const anterior = puntos[puntos.length - 2];
    const diffPeso = ultimo.peso - anterior.peso;
    const diffDias = Math.abs(
      (new Date(ultimo.fecha) - new Date(anterior.fecha)) / (1000 * 60 * 60 * 24)
    );
    return diffDias > 0 ? (diffPeso / diffDias).toFixed(3) : null;
  };

  const gananciaDiaria = useMemo(() => calcularGananciaDiaria(), [detalle]);

  return (
    <TouchableOpacity
      style={styles.animalCard}
      onPress={cargarDetalle}
    >
      <View style={styles.animalHeader}>
        <View>
          <Text style={styles.animalName}>
            {animal.sexo === 'hembra' ? '🐄' : '🐂'} {animal.nombre || 'Sin nombre'}
          </Text>
          <Text style={styles.animalCaravana}>Caravana: {animal.caravana}</Text>
          <Text style={styles.animalInfo}>
            {animal.raza} • {animal.potrero || 'Sin potrero'}
          </Text>
        </View>
        <View style={styles.animalPeso}>
          <Text style={styles.pesoNumero}>{animal.peso_actual || '-'}</Text>
          <Text style={styles.pesoUnidad}>kg</Text>
        </View>
      </View>

      {expanded && detalle && (
        <View style={styles.animalDetalle}>
          <Text style={styles.detalleTitle}>📊 Último Pesaje</Text>
          <Text style={styles.detalleText}>
            Fecha: {formatearFecha(detalle.fecha_ultimo_peso) || 'No registrado'}
          </Text>
          
          {gananciaDiaria && (
            <Text style={styles.gananciaText}>
              Ganancia diaria: {gananciaDiaria} kg/día
            </Text>
          )}

          {detalle.tratamientos && detalle.tratamientos.length > 0 && (
            <>
              <Text style={styles.detalleTitle}>💉 Último Tratamiento</Text>
              <Text style={styles.detalleText}>
                {detalle.tratamientos[0].tipo}: {detalle.tratamientos[0].descripcion}
              </Text>
              {detalle.tratamientos[0].proxima_fecha && (
                <Text style={styles.alertText}>
                  ⚠️ Próximo: {formatearFecha(detalle.tratamientos[0].proxima_fecha)}
                </Text>
              )}
            </>
          )}

          <Text style={styles.tapToClose}>Toca para cerrar</Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

// ==================== PANTALLA DE ESCANEO ====================
const ScanScreen = ({ token, onBack }) => {
  const [caravana, setCaravana] = useState('');
  const [animal, setAnimal] = useState(null);
  const [loading, setLoading] = useState(false);
  const [nuevoRegistro, setNuevoRegistro] = useState({
    peso: '',
    notas: '',
  });

  const buscarAnimal = async (codigoCaravana) => {
    setLoading(true);
    try {
      const response = await fetch(
        `${API_URL}/animales/caravana/${codigoCaravana}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.ok) {
        const data = await response.json();
        setAnimal(data);
      } else {
        Alert.alert(
          'Animal no encontrado',
          '¿Deseas registrar este animal?',
          [
            { text: 'Cancelar', style: 'cancel' },
            { text: 'Registrar', onPress: () => registrarNuevoAnimal(codigoCaravana) }
          ]
        );
      }
    } catch (error) {
      Alert.alert('Error', 'No se pudo buscar el animal');
    }
    setLoading(false);
  };

  const registrarNuevoAnimal = (codigoCaravana) => {
    Alert.alert('Info', 'Función de registro en desarrollo');
  };

  const registrarPesaje = async () => {
    if (!nuevoRegistro.peso) {
      Alert.alert('Error', 'Ingresa el peso del animal');
      return;
    }

    try {
      const response = await fetch(`${API_URL}/pesajes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          animal_id: animal.id,
          peso: parseFloat(nuevoRegistro.peso),
          fecha: new Date().toISOString().split('T')[0],
          notas: nuevoRegistro.notas,
        }),
      });

      if (response.ok) {
        Alert.alert('Éxito', 'Pesaje registrado correctamente');
        setNuevoRegistro({ peso: '', notas: '' });
        buscarAnimal(animal.caravana);
      }
    } catch (error) {
      Alert.alert('Error', 'No se pudo registrar el pesaje');
    }
  };

  return (
    <ScrollView style={styles.content}>
      <TouchableOpacity style={styles.backButton} onPress={onBack}>
        <Text style={styles.backButtonText}>← Volver</Text>
      </TouchableOpacity>

      <Text style={styles.scanTitle}>Escanear Caravana</Text>

      <View style={styles.scanInputContainer}>
        <TextInput
          style={styles.scanInput}
          placeholder="ARG001234567890"
          value={caravana}
          onChangeText={setCaravana}
          autoCapitalize="characters"
        />
        <TouchableOpacity
          style={styles.scanSearchButton}
          onPress={() => buscarAnimal(caravana)}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.scanSearchButtonText}>Buscar</Text>
          )}
        </TouchableOpacity>
      </View>

      <Text style={styles.scanHelp}>
        💡 En producción: conecta tu bastón Bluetooth RFID
      </Text>

      {animal && (
        <View style={styles.animalDetail}>
          <Text style={styles.detailTitle}>
            {animal.sexo === 'hembra' ? '🐄' : '🐂'} {animal.nombre}
          </Text>
          <Text style={styles.detailCaravana}>{animal.caravana}</Text>

          <View style={styles.detailGrid}>
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Raza</Text>
              <Text style={styles.detailValue}>{animal.raza}</Text>
            </View>
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Potrero</Text>
              <Text style={styles.detailValue}>{animal.potrero || 'N/A'}</Text>
            </View>
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Peso Actual</Text>
              <Text style={styles.detailValue}>{animal.peso_actual || '-'} kg</Text>
            </View>
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Último Pesaje</Text>
              <Text style={styles.detailValue}>
                {formatearFecha(animal.fecha_ultimo_peso) || 'N/A'}
              </Text>
            </View>
          </View>

          <Text style={styles.formTitle}>Registrar Nuevo Pesaje</Text>

          <TextInput
            style={styles.formInput}
            placeholder="Peso (kg)"
            value={nuevoRegistro.peso}
            onChangeText={(text) =>
              setNuevoRegistro({ ...nuevoRegistro, peso: text })
            }
            keyboardType="numeric"
          />

          <TextInput
            style={[styles.formInput, styles.formTextArea]}
            placeholder="Notas (opcional)"
            value={nuevoRegistro.notas}
            onChangeText={(text) =>
              setNuevoRegistro({ ...nuevoRegistro, notas: text })
            }
            multiline
            numberOfLines={3}
          />

          <TouchableOpacity style={styles.submitButton} onPress={registrarPesaje}>
            <Text style={styles.submitButtonText}>Guardar Pesaje</Text>
          </TouchableOpacity>

          {(() => {
            const filas = [];
            if (animal.peso_nacimiento != null && animal.fecha_nacimiento) {
              filas.push({ id: 'nacimiento', fecha: animal.fecha_nacimiento, peso: animal.peso_nacimiento, notas: 'Peso al nacer / alta' });
            }
            if (animal.pesajes && animal.pesajes.length > 0) filas.push(...animal.pesajes);
            filas.sort((a, b) => (a.fecha || '').localeCompare(b.fecha || ''));
            if (filas.length === 0) return null;
            return (
              <>
                <Text style={styles.historyTitle}>📊 Historial de Pesajes</Text>
                {filas.map((p) => (
                  <View key={p.id || 'nacimiento'} style={styles.historyItem}>
                    <Text style={styles.historyDate}>{formatearFecha(p.fecha)}</Text>
                    <Text style={styles.historyPeso}>{p.peso} kg</Text>
                    {p.notas && <Text style={styles.historyNotas}>{p.notas}</Text>}
                  </View>
                ))}
              </>
            );
          })()}
        </View>
      )}
    </ScrollView>
  );
};

// ==================== APP PRINCIPAL ====================
export default function App() {
  const [token, setToken] = useState(null);
  const [usuario, setUsuario] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const savedToken = await AsyncStorage.getItem('token');
      const savedUsuario = await AsyncStorage.getItem('usuario');

      if (savedToken && savedUsuario) {
        setToken(savedToken);
        setUsuario(JSON.parse(savedUsuario));
      }
    } catch (error) {
      console.log('Error al cargar sesión');
    }
    setLoading(false);
  };

  const handleLogin = (newToken, newUsuario) => {
    setToken(newToken);
    setUsuario(newUsuario);
  };

  const handleLogout = async () => {
    await AsyncStorage.removeItem('token');
    await AsyncStorage.removeItem('usuario');
    setToken(null);
    setUsuario(null);
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#2E7D32" />
      </View>
    );
  }

  return token ? (
    <MainScreen token={token} usuario={usuario} onLogout={handleLogout} />
  ) : (
    <LoginScreen onLogin={handleLogin} />
  );
}

// ==================== ESTILOS ====================
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  loginCard: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
    maxWidth: 400,
    alignSelf: 'center',
    width: '100%',
  },
  logo: {
    fontSize: 48,
    textAlign: 'center',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 18,
    textAlign: 'center',
    color: '#666',
    marginBottom: 40,
  },
  input: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 8,
    marginBottom: 15,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  button: {
    backgroundColor: '#2E7D32',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  demoInfo: {
    marginTop: 20,
    textAlign: 'center',
    color: '#999',
    fontSize: 14,
  },
  header: {
    backgroundColor: '#2E7D32',
    padding: 20,
    paddingTop: 40,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  headerSubtitle: {
    color: '#E8F5E9',
    fontSize: 14,
  },
  logoutButton: {
    color: '#fff',
    fontSize: 14,
    textDecorationLine: 'underline',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  statCard: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 8,
    flex: 1,
    marginHorizontal: 5,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statNumber: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#2E7D32',
  },
  statLabel: {
    fontSize: 14,
    color: '#666',
    marginTop: 5,
  },
  scanButton: {
    backgroundColor: '#4CAF50',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 20,
  },
  scanButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  refreshButton: {
    fontSize: 24,
  },
  animalList: {
    flex: 1,
  },
  animalCard: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  animalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  animalName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  animalCaravana: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },
  animalInfo: {
    fontSize: 14,
    color: '#666',
    marginTop: 5,
  },
  animalPeso: {
    alignItems: 'center',
  },
  pesoNumero: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#2E7D32',
  },
  pesoUnidad: {
    fontSize: 14,
    color: '#666',
  },
  animalDetalle: {
    marginTop: 15,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  detalleTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 10,
    marginBottom: 5,
  },
  detalleText: {
    fontSize: 14,
    color: '#666',
  },
  gananciaText: {
    fontSize: 14,
    color: '#4CAF50',
    fontWeight: 'bold',
    marginTop: 5,
  },
  alertText: {
    fontSize: 14,
    color: '#FF9800',
    marginTop: 5,
  },
  tapToClose: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
    marginTop: 10,
    fontStyle: 'italic',
  },
  bottomNav: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  navButton: {
    flex: 1,
    padding: 15,
    alignItems: 'center',
  },
  navIcon: {
    fontSize: 24,
    marginBottom: 5,
  },
  navText: {
    fontSize: 12,
    color: '#999',
  },
  navTextActive: {
    color: '#2E7D32',
    fontWeight: 'bold',
  },
  backButton: {
    marginBottom: 20,
  },
  backButtonText: {
    fontSize: 16,
    color: '#2E7D32',
  },
  scanTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#333',
  },
  scanInputContainer: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  scanInput: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 8,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#ddd',
    marginRight: 10,
  },
  scanSearchButton: {
    backgroundColor: '#2E7D32',
    padding: 15,
    borderRadius: 8,
    justifyContent: 'center',
    minWidth: 100,
  },
  scanSearchButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  scanHelp: {
    fontSize: 14,
    color: '#666',
    marginBottom: 20,
    textAlign: 'center',
  },
  animalDetail: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  detailTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  detailCaravana: {
    fontSize: 14,
    color: '#999',
    marginBottom: 20,
  },
  detailGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 20,
  },
  detailItem: {
    width: '50%',
    marginBottom: 15,
  },
  detailLabel: {
    fontSize: 12,
    color: '#999',
    marginBottom: 3,
  },
  detailValue: {
    fontSize: 16,
    color: '#333',
    fontWeight: 'bold',
  },
  formTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 20,
    marginBottom: 15,
  },
  formInput: {
    backgroundColor: '#F5F5F5',
    padding: 15,
    borderRadius: 8,
    fontSize: 16,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  formTextArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  submitButton: {
    backgroundColor: '#4CAF50',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  historyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 30,
    marginBottom: 15,
  },
  historyItem: {
    backgroundColor: '#F5F5F5',
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
  },
  historyDate: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
  historyPeso: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2E7D32',
  },
  historyNotas: {
    fontSize: 14,
    color: '#666',
    marginTop: 5,
    fontStyle: 'italic',
  },
});

import React, { useContext, useState, useEffect, useCallback } from 'react';
import { AuthContext } from '../context/Auth';
import { useNavigate } from 'react-router-dom';
import { ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import '../styles/desktop/Dashboard.scss';

const Dashboard = () => {
  const { user, profile, saveProfile, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [log, setLog] = useState({ waterIntakeMl: 0, sleepHours: 0, foods: [] });
  const [loadingLog, setLoadingLog] = useState(true);

  // Profile setup states
  const [profileForm, setProfileForm] = useState({
    name: '',
    age: 25,
    gender: 'male',
    heightCm: 170,
    weightKg: 70,
    activityLevel: 'level_1',
    targetWeightKg: 70,
    dailyCalorieTarget: 2000
  });

  // Food logging states
  const [foodForm, setFoodForm] = useState({
    foodName: '',
    calories: '',
    proteinGrams: '',
    carbsGrams: '',
    fatsGrams: '',
    mealType: 'breakfast'
  });

  const backendUrl = process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000';

  const fetchDailyLog = useCallback(async () => {
    if (!user) return;
    setLoadingLog(true);
    try {
      const res = await fetch(`${backendUrl}/api/calories/logs?date=${date}`, {
        headers: {
          Authorization: `Bearer ${user.token}`
        }
      });
      if (res.ok) {
        const data = await res.json();
        setLog(data);
      }
    } catch (err) {
      console.error('Failed to fetch daily logs:', err);
    } finally {
      setLoadingLog(false);
    }
  }, [user, date, backendUrl]);

  useEffect(() => {
    if (!user) {
      navigate('/login');
    } else {
      fetchDailyLog();
    }
  }, [user, navigate, fetchDailyLog]);

  useEffect(() => {
    if (profile) {
      setProfileForm({
        name: profile.name || '',
        age: profile.age || 25,
        gender: profile.gender || 'male',
        heightCm: profile.heightCm || 170,
        weightKg: profile.weightKg || 70,
        activityLevel: profile.activityLevel || 'level_1',
        targetWeightKg: profile.targetWeightKg || 70,
        dailyCalorieTarget: profile.dailyCalorieTarget || 2000
      });
    }
  }, [profile]);

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    await saveProfile(profileForm);
  };

  const handleAddFood = async (e) => {
    e.preventDefault();
    if (!foodForm.foodName || !foodForm.calories) return;

    try {
      const res = await fetch(`${backendUrl}/api/calories/logs`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${user.token}`
        },
        body: JSON.stringify({
          date,
          food: {
            foodName: foodForm.foodName,
            calories: parseInt(foodForm.calories),
            proteinGrams: parseInt(foodForm.proteinGrams) || 0,
            carbsGrams: parseInt(foodForm.carbsGrams) || 0,
            fatsGrams: parseInt(foodForm.fatsGrams) || 0,
            mealType: foodForm.mealType
          }
        })
      });

      if (res.ok) {
        const updatedLog = await res.json();
        setLog(updatedLog);
        setFoodForm({
          foodName: '',
          calories: '',
          proteinGrams: '',
          carbsGrams: '',
          fatsGrams: '',
          mealType: 'snack'
        });
      }
    } catch (err) {
      console.error('Failed to add food:', err);
    }
  };

  const handleDeleteFood = async (foodId) => {
    try {
      const res = await fetch(`${backendUrl}/api/calories/logs/food/${foodId}?date=${date}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${user.token}`
        }
      });
      if (res.ok) {
        const updatedLog = await res.json();
        setLog(updatedLog);
      }
    } catch (err) {
      console.error('Failed to delete food:', err);
    }
  };

  const updateWater = async (amount) => {
    const newWater = Math.max(0, log.waterIntakeMl + amount);
    try {
      const res = await fetch(`${backendUrl}/api/calories/logs`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${user.token}`
        },
        body: JSON.stringify({
          date,
          waterIntakeMl: newWater
        })
      });
      if (res.ok) {
        const updatedLog = await res.json();
        setLog(updatedLog);
      }
    } catch (err) {
      console.error('Failed to update water:', err);
    }
  };

  // Calculations
  const calorieTarget = profile ? profile.dailyCalorieTarget : 2000;
  const caloriesConsumed = log.foods.reduce((sum, f) => sum + f.calories, 0);
  const caloriesRemaining = Math.max(0, calorieTarget - caloriesConsumed);

  const totalProtein = log.foods.reduce((sum, f) => sum + f.proteinGrams, 0);
  const totalCarbs = log.foods.reduce((sum, f) => sum + f.carbsGrams, 0);
  const totalFats = log.foods.reduce((sum, f) => sum + f.fatsGrams, 0);

  const macroData = [
    { name: 'Protein (g)', value: totalProtein, color: '#FF7041' },
    { name: 'Carbs (g)', value: totalCarbs, color: '#0D7D4E' },
    { name: 'Fats (g)', value: totalFats, color: '#F59E0B' }
  ].filter(m => m.value > 0);

  if (!profile) {
    return (
      <main className="dashboard-setup-page">
        <div className="setup-container">
          <h2>Create Your Health Profile</h2>
          <p>Please enter your physical details to calculate your recommended calorie targets.</p>
          <form onSubmit={handleProfileSubmit} className="setup-form">
            <div className="input-row">
              <div className="input-group">
                <label>Name</label>
                <input
                  type="text"
                  value={profileForm.name}
                  onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                  required
                />
              </div>
              <div className="input-group">
                <label>Age</label>
                <input
                  type="number"
                  value={profileForm.age}
                  onChange={(e) => setProfileForm({ ...profileForm, age: parseInt(e.target.value) })}
                  min="15"
                  max="80"
                  required
                />
              </div>
            </div>

            <div className="input-row">
              <div className="input-group">
                <label>Gender</label>
                <select
                  value={profileForm.gender}
                  onChange={(e) => setProfileForm({ ...profileForm, gender: e.target.value })}
                >
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                </select>
              </div>
              <div className="input-group">
                <label>Activity Level</label>
                <select
                  value={profileForm.activityLevel}
                  onChange={(e) => setProfileForm({ ...profileForm, activityLevel: e.target.value })}
                >
                  <option value="level_1">Sedentary (No exercise)</option>
                  <option value="level_2">1-3 times/week</option>
                  <option value="level_3">4-5 times/week</option>
                  <option value="level_4">Daily exercise</option>
                  <option value="level_5">Intense exercise daily</option>
                </select>
              </div>
            </div>

            <div className="input-row">
              <div className="input-group">
                <label>Height (cm)</label>
                <input
                  type="number"
                  value={profileForm.heightCm}
                  onChange={(e) => setProfileForm({ ...profileForm, heightCm: parseInt(e.target.value) })}
                  min="130"
                  max="230"
                  required
                />
              </div>
              <div className="input-group">
                <label>Weight (kg)</label>
                <input
                  type="number"
                  value={profileForm.weightKg}
                  onChange={(e) => setProfileForm({ ...profileForm, weightKg: parseInt(e.target.value) })}
                  min="40"
                  max="160"
                  required
                />
              </div>
            </div>

            <div className="input-row">
              <div className="input-group">
                <label>Target Weight (kg)</label>
                <input
                  type="number"
                  value={profileForm.targetWeightKg}
                  onChange={(e) => setProfileForm({ ...profileForm, targetWeightKg: parseInt(e.target.value) })}
                  required
                />
              </div>
              <div className="input-group">
                <label>Daily Calorie Target</label>
                <input
                  type="number"
                  value={profileForm.dailyCalorieTarget}
                  onChange={(e) => setProfileForm({ ...profileForm, dailyCalorieTarget: parseInt(e.target.value) })}
                  required
                />
              </div>
            </div>

            <button type="submit" className="setup-submit-btn">
              Generate Dashboard <i className="fa-solid fa-arrow-right"></i>
            </button>
          </form>
        </div>
      </main>
    );
  }

  return (
    <main className="dashboard-page">
      <header className="dashboard-header">
        <div className="header-info">
          <h1>Welcome back, {profile.name}!</h1>
          <p>Track your nutrition, calories, and water logs.</p>
        </div>
        <div className="header-actions">
          <input
            type="date"
            className="date-picker"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
          <button onClick={logout} className="logout-btn">
            <i className="fa-solid fa-arrow-right-from-bracket"></i>
            <span>Log Out</span>
          </button>
        </div>
      </header>

      {/* Main Grid */}
      <div className="dashboard-grid">
        {/* Calorie Stats Card */}
        <section className="dashboard-card calorie-card">
          <h3>Daily Calorie Budget</h3>
          <div className="calorie-rings">
            <div className="calorie-stat">
              <span className="number">{calorieTarget}</span>
              <span className="label">Target kcal</span>
            </div>
            <div className="calorie-divider">-</div>
            <div className="calorie-stat">
              <span className="number orange">{caloriesConsumed}</span>
              <span className="label">Consumed</span>
            </div>
            <div className="calorie-divider">=</div>
            <div className="calorie-stat">
              <span className="number green">{caloriesRemaining}</span>
              <span className="label">Remaining</span>
            </div>
          </div>
          <div className="progress-bar-container">
            <div
              className="progress-bar"
              style={{ width: `${Math.min(100, (caloriesConsumed / calorieTarget) * 100)}%` }}
            ></div>
          </div>
        </section>

        {/* Water Log Card */}
        <section className="dashboard-card water-card">
          <h3>Hydration Tracker</h3>
          <div className="water-tracker-container">
            <div className="glass-icon">
              <i className="fa-solid fa-glass-water"></i>
            </div>
            <div className="water-stat">
              <span className="water-amount">{log.waterIntakeMl} ml</span>
              <span className="water-goal">Target: 2500 ml</span>
            </div>
            <div className="water-buttons">
              <button onClick={() => updateWater(-250)} className="water-btn minus">
                -250ml
              </button>
              <button onClick={() => updateWater(250)} className="water-btn plus">
                +250ml
              </button>
            </div>
          </div>
        </section>

        {/* Macro Chart Card */}
        <section className="dashboard-card macro-card">
          <h3>Today's Macronutrients</h3>
          {macroData.length > 0 ? (
            <div className="macro-chart-container">
              <ResponsiveContainer width="100%" height={150}>
                <PieChart>
                  <Pie
                    data={macroData}
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={60}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {macroData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="empty-chart">No food logged today to calculate macros.</div>
          )}
        </section>

        {/* Food Logger (Form + Lists) */}
        <section className="dashboard-card food-logger-card">
          <h3>Food Diary</h3>
          <form onSubmit={handleAddFood} className="food-form">
            <div className="form-row">
              <input
                type="text"
                placeholder="Food item name (e.g. Avocado Toast)"
                value={foodForm.foodName}
                onChange={(e) => setFoodForm({ ...foodForm, foodName: e.target.value })}
                required
              />
              <input
                type="number"
                placeholder="Calories"
                value={foodForm.calories}
                onChange={(e) => setFoodForm({ ...foodForm, calories: e.target.value })}
                required
              />
            </div>
            <div className="form-row secondary">
              <input
                type="number"
                placeholder="Protein (g)"
                value={foodForm.proteinGrams}
                onChange={(e) => setFoodForm({ ...foodForm, proteinGrams: e.target.value })}
              />
              <input
                type="number"
                placeholder="Carbs (g)"
                value={foodForm.carbsGrams}
                onChange={(e) => setFoodForm({ ...foodForm, carbsGrams: e.target.value })}
              />
              <input
                type="number"
                placeholder="Fats (g)"
                value={foodForm.fatsGrams}
                onChange={(e) => setFoodForm({ ...foodForm, fatsGrams: e.target.value })}
              />
              <select
                value={foodForm.mealType}
                onChange={(e) => setFoodForm({ ...foodForm, mealType: e.target.value })}
              >
                <option value="breakfast">Breakfast</option>
                <option value="lunch">Lunch</option>
                <option value="dinner">Dinner</option>
                <option value="snack">Snack</option>
              </select>
              <button type="submit" className="add-food-btn">
                Add <i className="fa-solid fa-plus"></i>
              </button>
            </div>
          </form>

          {/* Food Log List */}
          <div className="food-list-container">
            {loadingLog ? (
              <div className="diary-loader">Loading daily logs...</div>
            ) : log.foods.length > 0 ? (
              <table className="food-table">
                <thead>
                  <tr>
                    <th>Meal</th>
                    <th>Food Item</th>
                    <th>Macros (P/C/F)</th>
                    <th>Calories</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {log.foods.map((food) => (
                    <tr key={food._id}>
                      <td className="meal-badge-td">
                        <span className={`meal-badge ${food.mealType}`}>{food.mealType}</span>
                      </td>
                      <td className="food-name-td">{food.foodName}</td>
                      <td>
                        {food.proteinGrams}g / {food.carbsGrams}g / {food.fatsGrams}g
                      </td>
                      <td className="calories-td">{food.calories} kcal</td>
                      <td>
                        <button
                          onClick={() => handleDeleteFood(food._id)}
                          className="delete-food-btn"
                          title="Remove item"
                        >
                          <i className="fa-solid fa-trash-can"></i>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="empty-diary">No food logged for this day. Fill the form to add entries!</div>
            )}
          </div>
        </section>
      </div>
    </main>
  );
};

export default Dashboard;

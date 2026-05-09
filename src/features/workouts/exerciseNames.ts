import { useLangStore } from '@/shared/i18n'

// Vietnamese names sourced from thehinh.com, ifitness.vn, nugym.vn, thehinh.com
const VI: Record<string, string> = {
  // Chest
  'Bench Press': 'Đẩy ngực (Bench Press)',
  'Incline Bench Press': 'Đẩy ngực dốc trên (Incline)',
  'Decline Bench Press': 'Đẩy ngực dốc xuống (Decline)',
  'Dumbbell Bench Press': 'Đẩy tạ đơn ngực ngang',
  'Incline Dumbbell Press': 'Đẩy tạ đơn ngực trên',
  'Dumbbell Fly': 'Bay ngực tạ đơn',
  'Cable Crossover': 'Ép ngực giàn cáp',
  'Chest Dip': 'Xà kép ngực',
  'Pec Deck': 'Ép ngực máy (Pec Deck)',
  'Push-Up': 'Hít đất',

  // Back
  'Deadlift': 'Deadlift',
  'Pull-Up': 'Hít xà đơn',
  'Chin-Up': 'Hít xà tay ngửa (Chin-Up)',
  'Barbell Row': 'Kéo tạ đòn cúi người',
  'Pendlay Row': 'Pendlay Row',
  'Single-Arm Dumbbell Row': 'Giật xô một tay',
  'Lat Pulldown': 'Kéo cáp lưng rộng',
  'Seated Cable Row': 'Kéo cáp ngồi',
  'T-Bar Row': 'T-Bar Row',
  'Face Pull': 'Face Pull',
  'Rack Pull': 'Rack Pull',

  // Shoulders
  'Overhead Press': 'Đẩy tạ qua đầu (OHP)',
  'Dumbbell Shoulder Press': 'Đẩy tạ đơn vai',
  'Arnold Press': 'Arnold Press',
  'Dumbbell Lateral Raise': 'Nâng tạ ngang',
  'Cable Lateral Raise': 'Nâng cáp ngang vai',
  'Front Raise': 'Bay vai trước',
  'Reverse Fly': 'Bay vai sau',
  'Upright Row': 'Rút cầu vai',
  'Machine Shoulder Press': 'Đẩy vai máy',

  // Biceps
  'Barbell Curl': 'Cuốn tạ đòn',
  'Dumbbell Curl': 'Cuốn tạ đơn',
  'Hammer Curl': 'Hammer Curl',
  'Preacher Curl': 'Preacher Curl',
  'Cable Curl': 'Cuốn cáp tay trước',
  'Concentration Curl': 'Concentration Curl',
  'Incline Dumbbell Curl': 'Cuốn tạ đơn ghế dốc',

  // Triceps
  'Tricep Pushdown': 'Kéo cáp tay sau',
  'Skull Crusher': 'Skull Crusher',
  'Overhead Tricep Extension': 'Đẩy tạ tay sau đầu',
  'Tricep Dip': 'Xà kép tay sau',
  'Close-Grip Bench Press': 'Đẩy ngực tay hẹp',
  'Tricep Kickback': 'Đẩy tạ sau lưng',
  'Diamond Push-Up': 'Hít đất kim cương',

  // Quads
  'Squat': 'Squat',
  'Front Squat': 'Squat trước (Front Squat)',
  'Hack Squat': 'Hack Squat',
  'Leg Press': 'Đẩy chân máy',
  'Leg Extension': 'Duỗi chân máy',
  'Lunge': 'Bước chùng',
  'Bulgarian Split Squat': 'Bulgarian Split Squat',
  'Goblet Squat': 'Goblet Squat',
  'Step-Up': 'Bước bục',

  // Hamstrings
  'Romanian Deadlift': 'Romanian Deadlift (RDL)',
  'Sumo Deadlift': 'Sumo Deadlift',
  'Leg Curl': 'Gập chân máy',
  'Nordic Curl': 'Nordic Curl',
  'Good Morning': 'Gánh tạ cúi người',

  // Glutes
  'Hip Thrust': 'Hip Thrust',
  'Glute Bridge': 'Glute Bridge',
  'Cable Kickback': 'Đá mông cáp',
  'Donkey Kick': 'Đá mông',
  'Sumo Squat': 'Squat sumo',

  // Calves
  'Standing Calf Raise': 'Nâng gót đứng',
  'Seated Calf Raise': 'Nâng gót ngồi',
  'Donkey Calf Raise': 'Donkey Calf Raise',
  'Single-Leg Calf Raise': 'Nâng gót một chân',

  // Abs / Core
  'Plank': 'Plank',
  'Side Plank': 'Plank bên',
  'Crunch': 'Gập bụng',
  'Decline Crunch': 'Gập bụng ghế dốc',
  'Hanging Leg Raise': 'Nâng chân treo xà',
  'Cable Crunch': 'Gập bụng cáp',
  'Ab Wheel Rollout': 'Lăn bánh xe bụng',
  'Russian Twist': 'Russian Twist',
  'Pallof Press': 'Pallof Press',
  'Dragon Flag': 'Dragon Flag',

  // Forearms
  'Wrist Curl': 'Cuốn cổ tay',
  'Reverse Wrist Curl': 'Cuốn cổ tay ngược',
  "Farmer's Walk": 'Đi bộ tạ nặng',
  'Plate Pinch': 'Kẹp đĩa tạ',

  // Traps
  'Barbell Shrug': 'Nhún vai tạ đòn',
  'Dumbbell Shrug': 'Nhún vai tạ đơn',
  'Smith Machine Shrug': 'Nhún vai máy Smith',
  'Trap Bar Shrug': 'Trap Bar Shrug',
  'High Pull': 'High Pull',

  // Adductors
  'Hip Adduction Machine': 'Máy ép đùi trong',
  'Copenhagen Plank': 'Copenhagen Plank',
  'Cable Hip Adduction': 'Kéo cáp đùi trong',
  'Sumo Leg Press': 'Đẩy chân kiểu sumo',
  'Side Lunge': 'Bước chùng ngang',

  // Abductors
  'Hip Abduction Machine': 'Máy dạng đùi ngoài',
  'Cable Hip Abduction': 'Kéo cáp đùi ngoài',
  'Banded Lateral Walk': 'Đi bộ ngang dây kháng lực',
  'Clamshell': 'Clamshell',
  'Side-Lying Leg Raise': 'Nâng chân nằm nghiêng',

  // Full Body
  'Burpee': 'Burpee',
  'Clean and Press': 'Clean and Press',
  'Kettlebell Swing': 'Kettlebell Swing',
  'Thruster': 'Thruster',
  'Turkish Get-Up': 'Turkish Get-Up',
  'Box Jump': 'Nhảy lên bục',

  // Cardio
  'Running': 'Chạy bộ',
  'Cycling': 'Đạp xe',
  'Rowing Machine': 'Máy chèo thuyền',
  'Jump Rope': 'Nhảy dây',
  'Assault Bike': 'Xe đạp gió',
  'Elliptical': 'Máy tập toàn thân (Elliptical)',
  'Stair Climber': 'Máy leo cầu thang',
  'Mountain Climber': 'Mountain Climber',
  'Treadmill Walk': 'Đi bộ máy chạy bộ',
}

export function localizeExerciseName(name: string, lang: string): string {
  if (lang === 'vi') return VI[name] ?? name
  return name
}

export function useLocalizedExerciseName() {
  const lang = useLangStore((s) => s.lang)
  return (name: string) => localizeExerciseName(name, lang)
}

import mongoose, { Schema, Document } from 'mongoose';

export interface IUserDocument extends Document {
  name: string;
  email: string;
  preferredCity: string;
  preferredLanguage: 'en' | 'ta' | 'hi';
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    preferredCity: { type: String, default: 'Delhi NCR' },
    preferredLanguage: { type: String, enum: ['en', 'ta', 'hi'], default: 'en' }
  },
  { timestamps: true }
);

export const UserModel = mongoose.models.User || mongoose.model<IUserDocument>('User', UserSchema);

export interface IFamilyProfileDocument extends Document {
  userId: string;
  name?: string;
  preferredCity: string;
  familySize: number;
  childrenPresent: boolean;
  elderlyPresent: boolean;
  outdoorWorkers: boolean;
  respiratorySensitivity: 'none' | 'mild' | 'moderate' | 'severe';
  commuteMethod: 'walking' | 'bicycle' | 'motorcycle' | 'car' | 'public_transit' | 'hybrid_remote';
  cookingMethod: 'lpg_gas' | 'electric_induction' | 'biomass_wood' | 'kerosene';
  ventilationType: 'cross_ventilation' | 'exhaust_fan_only' | 'closed_ac' | 'open_windows';
  airPurifierAvailable: boolean;
  budgetPreference: 'free' | 'under500' | 'premium';
  preferredLanguage: 'en' | 'ta' | 'hi';
  createdAt: Date;
  updatedAt: Date;
}

const FamilyProfileSchema = new Schema(
  {
    userId: { type: String, required: true, unique: true, index: true },
    name: { type: String, default: 'Family' },
    preferredCity: { type: String, default: 'Delhi NCR' },
    familySize: { type: Number, default: 3, min: 1 },
    childrenPresent: { type: Boolean, default: false },
    elderlyPresent: { type: Boolean, default: false },
    outdoorWorkers: { type: Boolean, default: false },
    respiratorySensitivity: {
      type: String,
      enum: ['none', 'mild', 'moderate', 'severe'],
      default: 'none'
    },
    commuteMethod: {
      type: String,
      enum: ['walking', 'bicycle', 'motorcycle', 'car', 'public_transit', 'hybrid_remote'],
      default: 'car'
    },
    cookingMethod: {
      type: String,
      enum: ['lpg_gas', 'electric_induction', 'biomass_wood', 'kerosene'],
      default: 'lpg_gas'
    },
    ventilationType: {
      type: String,
      enum: ['cross_ventilation', 'exhaust_fan_only', 'closed_ac', 'open_windows'],
      default: 'cross_ventilation'
    },
    airPurifierAvailable: { type: Boolean, default: false },
    budgetPreference: {
      type: String,
      enum: ['free', 'under500', 'premium'],
      default: 'under500'
    },
    preferredLanguage: {
      type: String,
      enum: ['en', 'ta', 'hi'],
      default: 'en'
    }
  },
  { timestamps: true }
);

export const FamilyProfileModel =
  mongoose.models.FamilyProfile || mongoose.model<IFamilyProfileDocument>('FamilyProfile', FamilyProfileSchema);

export interface IAqiRecordDocument extends Document {
  city: string;
  latitude: number;
  longitude: number;
  usAqi: number;
  category: string;
  pm25: number;
  pm10: number;
  no2: number;
  o3: number;
  so2: number;
  co: number;
  recordedAt: Date;
}

const AqiRecordSchema = new Schema(
  {
    city: { type: String, required: true, index: true },
    latitude: { type: Number, required: true },
    longitude: { type: Number, required: true },
    usAqi: { type: Number, required: true },
    category: { type: String, required: true },
    pm25: { type: Number, required: true },
    pm10: { type: Number, required: true },
    no2: { type: Number, default: 0 },
    o3: { type: Number, default: 0 },
    so2: { type: Number, default: 0 },
    co: { type: Number, default: 0 },
    recordedAt: { type: Date, default: Date.now, index: true }
  },
  { timestamps: true }
);

AqiRecordSchema.index({ city: 1, recordedAt: -1 });

export const AqiRecordModel =
  mongoose.models.AqiRecord || mongoose.model<IAqiRecordDocument>('AqiRecord', AqiRecordSchema);

export interface IDailyRoutineDocument extends Document {
  userId: string;
  date: string;
  city: string;
  usAqi: number;
  tasks: Array<{
    id: string;
    phase: 'morning' | 'afternoon' | 'evening' | 'night';
    title: string;
    description: string;
    precaution: string;
    completed: boolean;
  }>;
  completionPercentage: number;
  createdAt: Date;
}

const DailyRoutineSchema = new Schema(
  {
    userId: { type: String, required: true, index: true },
    date: { type: String, required: true },
    city: { type: String, required: true },
    usAqi: { type: Number, required: true },
    tasks: [
      {
        id: { type: String, required: true },
        phase: { type: String, enum: ['morning', 'afternoon', 'evening', 'night'], required: true },
        title: { type: String, required: true },
        description: { type: String, required: true },
        precaution: { type: String, default: '' },
        completed: { type: Boolean, default: false }
      }
    ],
    completionPercentage: { type: Number, default: 0 }
  },
  { timestamps: true }
);

DailyRoutineSchema.index({ userId: 1, date: 1 }, { unique: true });

export const DailyRoutineModel =
  mongoose.models.DailyRoutine || mongoose.model<IDailyRoutineDocument>('DailyRoutine', DailyRoutineSchema);

export interface IChatHistoryDocument extends Document {
  userId: string;
  sessionId: string;
  role: 'user' | 'assistant' | 'system';
  message: string;
  structuredDetails?: Record<string, any>;
  timestamp: Date;
}

const ChatHistorySchema = new Schema(
  {
    userId: { type: String, required: true, index: true },
    sessionId: { type: String, default: 'default_session', index: true },
    role: { type: String, enum: ['user', 'assistant', 'system'], required: true },
    message: { type: String, required: true },
    structuredDetails: { type: Schema.Types.Mixed },
    timestamp: { type: Date, default: Date.now }
  },
  { timestamps: true }
);

ChatHistorySchema.index({ userId: 1, timestamp: -1 });

export const ChatHistoryModel =
  mongoose.models.ChatHistory || mongoose.model<IChatHistoryDocument>('ChatHistory', ChatHistorySchema);

export interface IPollutionAlertDocument extends Document {
  userId: string;
  city: string;
  thresholdAqi: number;
  currentAqi: number;
  severity: 'info' | 'warning' | 'hazardous';
  message: string;
  isRead: boolean;
  createdAt: Date;
}

const PollutionAlertSchema = new Schema(
  {
    userId: { type: String, required: true, index: true },
    city: { type: String, required: true },
    thresholdAqi: { type: Number, default: 150 },
    currentAqi: { type: Number, required: true },
    severity: { type: String, enum: ['info', 'warning', 'hazardous'], default: 'warning' },
    message: { type: String, required: true },
    isRead: { type: Boolean, default: false }
  },
  { timestamps: true }
);

export const PollutionAlertModel =
  mongoose.models.PollutionAlert || mongoose.model<IPollutionAlertDocument>('PollutionAlert', PollutionAlertSchema);

export interface IEnvironmentalImpactDocument extends Document {
  userId: string;
  distanceKm: number;
  baselineMode: string;
  alternativeMode: string;
  daysPerWeek: number;
  co2SavedPerTripKg: number;
  monthlyCo2SavedKg: number;
  annualCo2SavedKg: number;
  emissionFactorSource: string;
  assumptions: string;
  createdAt: Date;
}

const EnvironmentalImpactSchema = new Schema(
  {
    userId: { type: String, required: true, index: true },
    distanceKm: { type: Number, required: true },
    baselineMode: { type: String, default: 'car_solo' },
    alternativeMode: { type: String, required: true },
    daysPerWeek: { type: Number, default: 5 },
    co2SavedPerTripKg: { type: Number, required: true },
    monthlyCo2SavedKg: { type: Number, required: true },
    annualCo2SavedKg: { type: Number, required: true },
    emissionFactorSource: { type: String, default: 'UK DEFRA / IPCC 2023 Guidelines' },
    assumptions: { type: String, default: '' }
  },
  { timestamps: true }
);

export const EnvironmentalImpactModel =
  mongoose.models.EnvironmentalImpact ||
  mongoose.model<IEnvironmentalImpactDocument>('EnvironmentalImpact', EnvironmentalImpactSchema);

export interface ICommunityPostDocument extends Document {
  city: string;
  authorLabel: string;
  postType: 'observation' | 'tip' | 'challenge';
  title: string;
  content: string;
  pollutantNoticed?: 'smoke' | 'construction_dust' | 'traffic_congestion' | 'biomass_burning';
  isVerified: boolean;
  upvotes: number;
  createdAt: Date;
}

const CommunityPostSchema = new Schema(
  {
    city: { type: String, required: true, index: true },
    authorLabel: { type: String, default: 'Neighborhood Resident' },
    postType: { type: String, enum: ['observation', 'tip', 'challenge'], required: true },
    title: { type: String, required: true },
    content: { type: String, required: true },
    pollutantNoticed: { type: String, enum: ['smoke', 'construction_dust', 'traffic_congestion', 'biomass_burning'] },
    isVerified: { type: Boolean, default: false },
    upvotes: { type: Number, default: 0 }
  },
  { timestamps: true }
);

export const CommunityPostModel =
  mongoose.models.CommunityPost || mongoose.model<ICommunityPostDocument>('CommunityPost', CommunityPostSchema);


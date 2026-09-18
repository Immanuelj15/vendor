import mongoose from 'mongoose';

const territorySchema = new mongoose.Schema(
  {
    type: {
      type: String,
      required: true,
      enum: ['STATE', 'DISTRICT', 'TALUK'],
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    code: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      uppercase: true,
      index: true,
    },
    parentTerritory: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Territory',
      default: null,
      index: true,
    },
    state: {
      type: String,
      trim: true,
      required: function() { return this.type !== 'STATE'; }
    },
    district: {
      type: String,
      trim: true,
      required: function() { return this.type === 'TALUK'; }
    },
    taluk: {
      type: String,
      trim: true,
    },
    pincodes: [
      {
        type: String,
        trim: true,
      }
    ],
    status: {
      type: String,
      required: true,
      enum: ['ACTIVE', 'INACTIVE'],
      default: 'ACTIVE',
      index: true,
    }
  },
  { timestamps: true }
);

territorySchema.index({ type: 1, parentTerritory: 1 });

export const Territory = mongoose.model('Territory', territorySchema);

/**
 * ===========================================
 * Platform Settings Model
 * ===========================================
 *
 * Singleton document that stores platform-level
 * configuration — most importantly the wallet
 * addresses that investors must send crypto to.
 *
 * Only one document should exist (enforced by the
 * unique `key` field defaulting to 'main').
 */

import mongoose from 'mongoose';

const platformSettingsSchema = new mongoose.Schema(
  {
    /** Ensures only one settings document exists. */
    key: {
      type: String,
      default: 'main',
      unique: true,
      immutable: true,
    },

    /* ── Wallet Addresses ── */
    wallets: {
      ETH: {
        type: String,
        default: '',
        trim: true,
      },
      BTC: {
        type: String,
        default: '',
        trim: true,
      },
      USDT: {
        type: String,
        default: '',
        trim: true,
      },
      USDC: {
        type: String,
        default: '',
        trim: true,
      },
    },

    /** Admin who last updated the settings */
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

/**
 * Static helper — returns the singleton settings doc,
 * creating it with defaults if it doesn't exist yet.
 */
platformSettingsSchema.statics.getSettings = async function () {
  let settings = await this.findOne({ key: 'main' });
  if (!settings) {
    settings = await this.create({ key: 'main' });
  }
  return settings;
};

const PlatformSettings = mongoose.model('PlatformSettings', platformSettingsSchema);

export default PlatformSettings;

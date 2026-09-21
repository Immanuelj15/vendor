import mongoose from 'mongoose';
import { Territory } from '../src/models/Territory.js';
import { env } from '../src/config/env.js';

const TERRITORY_DATA = [
  {
    state: { name: 'Karnataka', code: 'KA' },
    districts: [
      {
        name: 'Bengaluru Urban',
        code: 'KA-BLR-URB',
        taluks: [
          { name: 'Bengaluru North', code: 'KA-BLR-NOR', pincodes: ['560001', '560002', '560003', '560004'] },
          { name: 'Bengaluru South', code: 'KA-BLR-SOU', pincodes: ['560011', '560041', '560070', '560078'] },
          { name: 'Bengaluru East', code: 'KA-BLR-EAS', pincodes: ['560016', '560037', '560048', '560066'] },
          { name: 'Yelahanka', code: 'KA-BLR-YEL', pincodes: ['560064', '560065'] },
          { name: 'Anekal', code: 'KA-BLR-ANE', pincodes: ['560099', '560100'] },
        ],
      },
      {
        name: 'Bengaluru Rural',
        code: 'KA-BLR-RUR',
        taluks: [
          { name: 'Devanahalli', code: 'KA-DEV', pincodes: ['562110'] },
          { name: 'Doddaballapura', code: 'KA-DOD', pincodes: ['561203'] },
          { name: 'Hosakote', code: 'KA-HOS', pincodes: ['562114'] },
          { name: 'Nelamangala', code: 'KA-NEL', pincodes: ['562123'] },
        ],
      },
      {
        name: 'Mysuru',
        code: 'KA-MYS',
        taluks: [
          { name: 'Mysuru City', code: 'KA-MYS-CTY', pincodes: ['570001', '570002', '570005'] },
          { name: 'Nanjangud', code: 'KA-MYS-NAN', pincodes: ['571301'] },
          { name: 'Hunsur', code: 'KA-MYS-HUN', pincodes: ['571105'] },
        ],
      },
      {
        name: 'Dakshina Kannada (Mangaluru)',
        code: 'KA-DK',
        taluks: [
          { name: 'Mangaluru', code: 'KA-MAN', pincodes: ['575001', '575002', '575003'] },
          { name: 'Bantwal', code: 'KA-BAN', pincodes: ['574211'] },
          { name: 'Puttur', code: 'KA-PUT', pincodes: ['574201'] },
        ],
      },
      {
        name: 'Belagavi',
        code: 'KA-BGM',
        taluks: [
          { name: 'Belagavi City', code: 'KA-BGM-CTY', pincodes: ['590001', '590002'] },
          { name: 'Gokak', code: 'KA-GOK', pincodes: ['591307'] },
          { name: 'Chikkodi', code: 'KA-CHK', pincodes: ['591201'] },
        ],
      },
      {
        name: 'Dharwad (Hubballi)',
        code: 'KA-DWR',
        taluks: [
          { name: 'Hubballi Urban', code: 'KA-HUB', pincodes: ['580020', '580021'] },
          { name: 'Dharwad City', code: 'KA-DWR-CTY', pincodes: ['580001', '580007'] },
        ],
      },
    ],
  },
  {
    state: { name: 'Maharashtra', code: 'MH' },
    districts: [
      {
        name: 'Mumbai Suburban',
        code: 'MH-MSD',
        taluks: [
          { name: 'Andheri', code: 'MH-AND', pincodes: ['400053', '400058', '400069'] },
          { name: 'Bandra', code: 'MH-BAN', pincodes: ['400050', '400051'] },
          { name: 'Borivali', code: 'MH-BOR', pincodes: ['400092', '400066'] },
          { name: 'Kurla', code: 'MH-KUR', pincodes: ['400070', '400072'] },
        ],
      },
      {
        name: 'Mumbai City',
        code: 'MH-MUM',
        taluks: [
          { name: 'Colaba & Fort', code: 'MH-COL', pincodes: ['400001', '400005'] },
          { name: 'Dadar & Matunga', code: 'MH-DAD', pincodes: ['400014', '400019'] },
        ],
      },
      {
        name: 'Pune',
        code: 'MH-PUN',
        taluks: [
          { name: 'Pune City', code: 'MH-PUN-CTY', pincodes: ['411001', '411002', '411004'] },
          { name: 'Haveli (Hadapsar)', code: 'MH-HAV', pincodes: ['411028'] },
          { name: 'Pimpri-Chinchwad', code: 'MH-PCMC', pincodes: ['411017', '411018', '411033'] },
          { name: 'Kothrud', code: 'MH-KOT', pincodes: ['411038'] },
        ],
      },
      {
        name: 'Thane',
        code: 'MH-THN',
        taluks: [
          { name: 'Thane City', code: 'MH-THN-CTY', pincodes: ['400601', '400602'] },
          { name: 'Navi Mumbai', code: 'MH-NVM', pincodes: ['400703', '400705'] },
          { name: 'Kalyan', code: 'MH-KAL', pincodes: ['421301'] },
        ],
      },
    ],
  },
  {
    state: { name: 'Tamil Nadu', code: 'TN' },
    districts: [
      {
        name: 'Chennai',
        code: 'TN-CHN',
        taluks: [
          { name: 'T. Nagar / Mambalam', code: 'TN-TNG', pincodes: ['600017', '600033'] },
          { name: 'Adyar / Guindy', code: 'TN-ADY', pincodes: ['600020', '600032'] },
          { name: 'Anna Nagar', code: 'TN-ANN', pincodes: ['600040'] },
          { name: 'Velachery / OMR', code: 'TN-VEL', pincodes: ['600042', '600096'] },
        ],
      },
      {
        name: 'Coimbatore',
        code: 'TN-CBE',
        taluks: [
          { name: 'Coimbatore North', code: 'TN-CBE-NOR', pincodes: ['641001', '641002'] },
          { name: 'Coimbatore South', code: 'TN-CBE-SOU', pincodes: ['641008', '641018'] },
          { name: 'Pollachi', code: 'TN-POL', pincodes: ['642001'] },
        ],
      },
      {
        name: 'Madurai',
        code: 'TN-MDU',
        taluks: [
          { name: 'Madurai North', code: 'TN-MDU-NOR', pincodes: ['625001', '625002'] },
          { name: 'Madurai South', code: 'TN-MDU-SOU', pincodes: ['625003', '625009'] },
        ],
      },
    ],
  },
  {
    state: { name: 'Delhi (NCT)', code: 'DL' },
    districts: [
      {
        name: 'Central Delhi',
        code: 'DL-CD',
        taluks: [
          { name: 'Connaught Place', code: 'DL-CP', pincodes: ['110001'] },
          { name: 'Karol Bagh', code: 'DL-KB', pincodes: ['110005'] },
        ],
      },
      {
        name: 'South Delhi',
        code: 'DL-SD',
        taluks: [
          { name: 'Hauz Khas', code: 'DL-HK', pincodes: ['110016'] },
          { name: 'Saket', code: 'DL-SKT', pincodes: ['110017'] },
        ],
      },
      {
        name: 'West Delhi',
        code: 'DL-WD',
        taluks: [
          { name: 'Rajouri Garden', code: 'DL-RG', pincodes: ['110027'] },
          { name: 'Janakpuri', code: 'DL-JKP', pincodes: ['110058'] },
        ],
      },
    ],
  },
  {
    state: { name: 'Telangana', code: 'TG' },
    districts: [
      {
        name: 'Hyderabad',
        code: 'TG-HYD',
        taluks: [
          { name: 'Banjara & Jubilee Hills', code: 'TG-BJH', pincodes: ['500034', '500033'] },
          { name: 'Secunderabad', code: 'TG-SEC', pincodes: ['500003'] },
          { name: 'Charminar', code: 'TG-CHR', pincodes: ['500002'] },
        ],
      },
      {
        name: 'Medchal-Malkajgiri',
        code: 'TG-MED',
        taluks: [
          { name: 'Kukatpally', code: 'TG-KUK', pincodes: ['500072'] },
          { name: 'Gachibowli & Madhapur (Hitec City)', code: 'TG-HIT', pincodes: ['500081', '500032'] },
        ],
      },
    ],
  },
  {
    state: { name: 'Gujarat', code: 'GJ' },
    districts: [
      {
        name: 'Ahmedabad',
        code: 'GJ-AMD',
        taluks: [
          { name: 'Ahmedabad City', code: 'GJ-AMD-CTY', pincodes: ['380001', '380006'] },
          { name: 'Navrangpura & Satellite', code: 'GJ-NAV', pincodes: ['380009', '380015'] },
        ],
      },
      {
        name: 'Surat',
        code: 'GJ-SRT',
        taluks: [
          { name: 'Surat City', code: 'GJ-SRT-CTY', pincodes: ['395001', '395002'] },
          { name: 'Varachha', code: 'GJ-VAR', pincodes: ['395006'] },
        ],
      },
    ],
  },
  {
    state: { name: 'Kerala', code: 'KL' },
    districts: [
      {
        name: 'Ernakulam (Kochi)',
        code: 'KL-EKM',
        taluks: [
          { name: 'Kochi & Marine Drive', code: 'KL-KOC', pincodes: ['682001', '682011'] },
          { name: 'Kakkanad (InfoPark)', code: 'KL-KAK', pincodes: ['682030'] },
        ],
      },
    ],
  },
  {
    state: { name: 'West Bengal', code: 'WB' },
    districts: [
      {
        name: 'Kolkata',
        code: 'WB-KOL',
        taluks: [
          { name: 'Central Kolkata', code: 'WB-KOL-CTY', pincodes: ['700001', '700012'] },
          { name: 'Salt Lake & New Town', code: 'WB-SLK', pincodes: ['700091', '700156'] },
        ],
      },
    ],
  },
  {
    state: { name: 'Uttar Pradesh', code: 'UP' },
    districts: [
      {
        name: 'Gautam Buddha Nagar (Noida)',
        code: 'UP-NOI',
        taluks: [
          { name: 'Noida Central', code: 'UP-NOI-CTY', pincodes: ['201301', '201303'] },
          { name: 'Greater Noida', code: 'UP-GRN', pincodes: ['201310'] },
        ],
      },
      {
        name: 'Lucknow',
        code: 'UP-LKO',
        taluks: [
          { name: 'Hazratganj', code: 'UP-HAZ', pincodes: ['226001'] },
          { name: 'Gomti Nagar', code: 'UP-GOM', pincodes: ['226010'] },
        ],
      },
    ],
  },
];

export async function seedTerritories() {
  console.log('📍 Seeding Indian States, Districts, and Taluks for FairKart Dispatch...\n');
  try {
    const mongoUri = env.MONGO_URI || 'mongodb://localhost:27017/fairkart';
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB');

    let totalStates = 0;
    let totalDistricts = 0;
    let totalTaluks = 0;

    for (const item of TERRITORY_DATA) {
      // 1. Upsert State
      const stateDoc = await Territory.findOneAndUpdate(
        { code: item.state.code },
        {
          type: 'STATE',
          name: item.state.name,
          code: item.state.code,
          parentTerritory: null,
          status: 'ACTIVE',
        },
        { upsert: true, new: true }
      );
      totalStates++;

      // 2. Upsert Districts
      for (const dist of item.districts) {
        const distDoc = await Territory.findOneAndUpdate(
          { code: dist.code },
          {
            type: 'DISTRICT',
            name: dist.name,
            code: dist.code,
            parentTerritory: stateDoc._id,
            state: stateDoc.name,
            status: 'ACTIVE',
          },
          { upsert: true, new: true }
        );
        totalDistricts++;

        // 3. Upsert Taluks
        for (const taluk of dist.taluks) {
          await Territory.findOneAndUpdate(
            { code: taluk.code },
            {
              type: 'TALUK',
              name: taluk.name,
              code: taluk.code,
              parentTerritory: distDoc._id,
              state: stateDoc.name,
              district: distDoc.name,
              taluk: taluk.name,
              pincodes: taluk.pincodes,
              status: 'ACTIVE',
            },
            { upsert: true, new: true }
          );
          totalTaluks++;
        }
      }
    }

    console.log(`🎉 Territory Seeding Complete!`);
    console.log(`   • States Seeded: ${totalStates}`);
    console.log(`   • Districts Seeded: ${totalDistricts}`);
    console.log(`   • Taluks / Dispatch Hubs Seeded: ${totalTaluks}\n`);

  } catch (err) {
    console.error('❌ Failed to seed territories:', err);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

// Execute if run directly
if (process.argv[1]?.includes('seedTerritories.js')) {
  seedTerritories().then(() => process.exit(0));
}

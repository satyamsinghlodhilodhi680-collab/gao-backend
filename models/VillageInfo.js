
import mongoose from "mongoose";

const villageInfoSchema = new mongoose.Schema(
  {
    villageName: {
      type: String,
      required: true,
      trim: true,
    },

    tehsil: {
      type: String,
      trim: true,
      default: "",
    },

    district: {
      type: String,
      required: true,
      trim: true,
    },

    state: {
      type: String,
      required: true,
      trim: true,
    },

    gramPanchayat: {
      type: String,
      required: true,
      trim: true,
    },

    introduction: {
      type: String,
      default: "",
      trim: true,
    },

    facilities: {
      school: {
        type: String,
        default: "",
      },
      health: {
        type: String,
        default: "",
      },
      drinkingWater: {
        type: String,
        default: "",
      },
      roads: {
        type: String,
        default: "",
      },
      transport: {
        type: String,
        default: "",
      },
      anganwadi: {
        type: String,
        default: "",
      },
    },



    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    
population: {
  type: Number,
  min: 0,
  default: null,
},

households: {
  type: Number,
  min: 0,
  default: null,
},

villageCode: {
  type: String,
  trim: true,
  default: "",
},

pinCode: {
  type: String,
  trim: true,
  default: "",
},

populationDataYear: {
  type: Number,
  default: null,
},

  },
  {
    timestamps: true,
  },
  

  
);

const VillageInfo = mongoose.model(
  "VillageInfo",
  villageInfoSchema
);





export default VillageInfo;

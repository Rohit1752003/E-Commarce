import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },

    password: {
      type: String,
     
    },
    googleId :{
        type : String,
        unique : true,
        sparse: true,

    },
    profileImg : {
        type : String,
        default : 'https://unsplash.com/photos/do-something-great-neon-sign-oqStl2L5oxI'
    },
    passwordResetToken: {
      type: String,
    },
    passwordResetExpires: {
      type: Date,
    },
    refreshToken: {
      type: String,
    },
      role:{
    type : String,
    enum : ['user', 'admin'],
    default : 'user'
  },
  emailVerified: {
    type: Boolean,
    default: false
},

emailVerificationToken: {
    type: String,
},

emailVerificationExpires: {
    type: Date
},
publicId :{
  type : String,
}
  },

  {
    timestamps: true,
  }
);

const User = mongoose.model('User', userSchema);

export default User;
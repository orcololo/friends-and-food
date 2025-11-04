import { NextRequest } from 'next/server';
import connectDB from '@/lib/db/mongodb';
import User from '@/lib/models/User';
import { comparePassword, generateToken } from '@/lib/utils/auth';
import { successResponse, errorResponse } from '@/lib/utils/response';

export async function POST(req: NextRequest) {
  try {
    await connectDB();

    const body = await req.json();
    const { email, password } = body;

    // Validate required fields
    if (!email || !password) {
      return errorResponse('Email and password are required', 400);
    }

    // Find user by email
    const user = await User.findOne({ email });

    if (!user) {
      return errorResponse('Invalid email or password', 401);
    }

    // Compare password
    const isPasswordValid = await comparePassword(password, user.password);

    if (!isPasswordValid) {
      return errorResponse('Invalid email or password', 401);
    }

    // Generate JWT token
    const token = generateToken({
      userId: user._id.toString(),
      email: user.email,
      username: user.username,
    });

    return successResponse({
      token,
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        username: user.username,
        profileImage: user.profileImage,
        bio: user.bio,
      },
    });
  } catch (error: any) {
    console.error('Login error:', error);
    return errorResponse(error.message || 'Login failed', 500);
  }
}

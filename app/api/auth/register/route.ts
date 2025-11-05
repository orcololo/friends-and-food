import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db/mongodb';
import User from '@/lib/models/User';
import { hashPassword, generateToken } from '@/lib/utils/auth';
import { successResponse, errorResponse } from '@/lib/utils/response';

export async function POST(req: NextRequest) {
  try {
    await connectDB();

    const body = await req.json();
    const { email, password, name, username } = body;

    // Validate required fields
    if (!email || !password || !name || !username) {
      return errorResponse('All fields are required', 400);
    }

    // Check if user already exists
    const existingUser = await User.findOne({
      $or: [{ email }, { username }],
    });

    if (existingUser) {
      return errorResponse('User with this email or username already exists', 400);
    }

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Create new user
    const user = await User.create({
      email,
      password: hashedPassword,
      name,
      username,
    });

    // Generate JWT token
    const token = generateToken({
      userId: String(user._id),
      email: user.email,
      username: user.username,
    });

    return successResponse(
      {
        token,
        user: {
          id: user._id,
          email: user.email,
          name: user.name,
          username: user.username,
          profileImage: user.profileImage,
        },
      },
      201
    );
  } catch (error: any) {
    console.error('Register error:', error);
    return errorResponse(error.message || 'Registration failed', 500);
  }
}

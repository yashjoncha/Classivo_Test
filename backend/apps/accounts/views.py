from rest_framework import status
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.views import TokenObtainPairView

from .serializers import CustomTokenObtainPairSerializer, SignupSerializer


class LoginView(TokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer


class SignupView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = SignupSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()

        # Generate JWT tokens for the new user
        token = CustomTokenObtainPairSerializer.get_token(user)

        return Response({
            'refresh': str(token),
            'access': str(token.access_token),
            'user_id': user.id,
            'role': user.role,
            'username': user.username,
        }, status=status.HTTP_201_CREATED)

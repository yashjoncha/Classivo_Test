from rest_framework import serializers
from rest_framework.validators import UniqueTogetherValidator

from .models import Answer, Chapter, Question


class ChapterSerializer(serializers.ModelSerializer):
    class Meta:
        model = Chapter
        fields = ['id', 'title', 'description', 'order', 'created_at']
        read_only_fields = ['created_at']


class QuestionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Question
        fields = ['id', 'chapter', 'text', 'options', 'correct', 'created_at']
        read_only_fields = ['created_at']


class AnswerSerializer(serializers.ModelSerializer):
    user = serializers.HiddenField(default=serializers.CurrentUserDefault())
    is_correct = serializers.BooleanField(read_only=True)

    class Meta:
        model = Answer
        fields = ['id', 'question', 'user', 'selected_option', 'is_correct', 'created_at']
        read_only_fields = ['created_at']
        validators = [
            UniqueTogetherValidator(
                queryset=Answer.objects.all(),
                fields=['question', 'user'],
                message='You have already answered this question.',
            )
        ]

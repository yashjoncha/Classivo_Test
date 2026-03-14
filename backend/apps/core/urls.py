from django.urls import path

from . import views

urlpatterns = [
    path('health/', views.health_check, name='health-check'),

    # Chapters
    path('chapters/', views.ChapterListCreateView.as_view(), name='chapter-list-create'),
    path('chapters/<int:chapter_id>/', views.ChapterDetailView.as_view(), name='chapter-detail'),

    # Questions
    path('questions/', views.QuestionListCreateView.as_view(), name='question-list-create'),
    path('questions/<int:question_id>/', views.QuestionDetailView.as_view(), name='question-detail'),

    # Answers
    path('answers/', views.AnswerCreateView.as_view(), name='answer-create'),
    path('answers/list/', views.AnswerListView.as_view(), name='answer-list'),
]

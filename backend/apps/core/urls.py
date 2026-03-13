from django.urls import path

from . import views

urlpatterns = [
    path('health/', views.health_check, name='health-check'),
    path('chapters/', views.ChapterListCreateView.as_view(), name='chapter-list-create'),
    path('chapters/<int:chapter_id>/', views.ChapterDetailView.as_view(), name='chapter-detail'),
    path('questions/', views.QuestionCreateView.as_view(), name='question-create'),
]

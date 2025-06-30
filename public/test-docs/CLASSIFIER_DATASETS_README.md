# Classifier Training Datasets

This folder contains sample CSV datasets for training text classifiers. Each dataset is designed for a specific classification task.

## Available Datasets

### 1. Customer Sentiment Dataset (`customer-sentiment-dataset.csv`)
- **Purpose**: Classify customer feedback into sentiment categories
- **Labels**: positive, negative, neutral
- **Use Case**: Analyze customer reviews, feedback forms, or social media comments
- **Sample Size**: 20 examples

### 2. Support Ticket Classification (`support-ticket-classification.csv`)
- **Purpose**: Categorize customer support tickets by issue type
- **Labels**: account_access, billing, technical_issue, shipping
- **Use Case**: Automatically route support tickets to the right department
- **Sample Size**: 20 examples

### 3. Email Spam Detection (`email-spam-detection.csv`)
- **Purpose**: Identify spam emails vs legitimate emails
- **Labels**: spam, not_spam
- **Use Case**: Email filtering systems, content moderation
- **Sample Size**: 20 examples

### 4. Product Category Classification (`product-category-classification.csv`)
- **Purpose**: Categorize products based on their descriptions
- **Labels**: electronics, clothing, food
- **Use Case**: E-commerce product organization, inventory management
- **Sample Size**: 20 examples

### 5. Intent Classification for Chatbots (`intent-classification-chatbot.csv`)
- **Purpose**: Understand user intent in conversational AI
- **Labels**: hours_inquiry, appointment_booking, pricing_inquiry, human_agent_request, order_tracking, weather_inquiry
- **Use Case**: Chatbot routing, automated customer service
- **Sample Size**: 20 examples

## Dataset Format

All datasets follow the same CSV format:
- First column: Text data to classify
- Second column: Label/category

## How to Use

1. Select a dataset that matches your use case
2. Upload it to the Classifier Index creation modal
3. The system will train a classifier based on your data
4. Test the classifier with new text inputs

## Tips for Best Results

- Ensure balanced representation of all categories
- Use clear, distinct examples for each category
- Consider adding more examples for better accuracy (these are minimal samples)
- Clean and preprocess text data if needed
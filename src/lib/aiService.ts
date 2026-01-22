export const aiService = {
    /**
     * Generates a professional customer service message based on a prompt and context.
     */
    async draftMessage(
        customerName: string,
        lastMessage: string,
        intent: 'update' | 'question' | 'completion' | 'booking'
    ): Promise<string> {
        // Simulate API delay
        await new Promise((resolve) => setTimeout(resolve, 1000));

        const greetings = ['Hello', 'Hi', 'Dear'];
        const greeting = `${greetings[Math.floor(Math.random() * greetings.length)]} ${customerName},`;

        switch (intent) {
            case 'update':
                return `${greeting}\n\nI wanted to give you a quick update on your vehicle. We are currently inspecting it and will have more details for you shortly.\n\nBest regards,\nThe Service Team`;

            case 'question':
                // Smart reply to a question
                return `${greeting}\n\nThank you for your question. Regarding "${lastMessage.substring(0, 20)}...", yes, we can certainly help with that. When would you like to discuss this further?\n\nBest,\nThe Service Team`;

            case 'completion':
                return `${greeting}\n\nGood news! Your vehicle is ready for pickup. Feel free to come by at your convenience.\n\nThanks,\nThe Service Team`;

            case 'booking':
                return `${greeting}\n\nWe would be happy to schedule that for you. Does 9:00 AM tomorrow work, or would you prefer a later slot?\n\nBest,\nThe Service Team`;

            default:
                return `${greeting}\n\nThank you for reaching out. How can we assist you today?`;
        }
    },

    /**
     * Detects the likely intent of the user's draft or last message
     */
    detectIntent(text: string): 'update' | 'question' | 'completion' | 'booking' {
        const lower = text.toLowerCase();
        if (lower.includes('schedule') || lower.includes('book') || lower.includes('appointment')) return 'booking';
        if (lower.includes('done') || lower.includes('ready') || lower.includes('finished')) return 'completion';
        if (lower.includes('?') || lower.includes('how') || lower.includes('what')) return 'question';
        return 'update';
    }
};

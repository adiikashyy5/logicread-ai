export interface AnswerOption {
  id: string;
  text: string;
}

export interface Question {
  id: string;
  text: string;
  options: AnswerOption[];
  correctOptionId: string;
  idealEvidenceSentence: string;
  explanation: string;
}

export interface ReadingModule {
  id: string;
  title: string;
  subject: string;
  difficulty: 'Year 4' | 'Year 5' | 'Year 6';
  estimatedMinutes: number;
  passage: string;
  questions: Question[];
  imageUrl: string;
}

export const READING_MODULES: ReadingModule[] = [
  {
    id: 'module-1',
    title: 'The Australian Micro-Bat',
    subject: 'Science & Nature',
    difficulty: 'Year 5',
    estimatedMinutes: 12,
    imageUrl: 'https://images.pexels.com/photos/3608263/pexels-photo-3608263.jpeg?w=400&h=250&fit=crop',
    passage: `The Australian micro-bat is one of the most remarkable nocturnal hunters in the Southern Hemisphere. Unlike larger bats, the micro-bat rarely exceeds the size of a human thumb, yet its biological systems are extraordinarily sophisticated.

Micro-bats navigate and hunt exclusively through echolocation — a biological sonar system in which the animal produces high-frequency sound pulses and interprets the returning echoes. This allows the micro-bat to locate and catch flying insects with extraordinary precision, even in conditions of total darkness.

However, not all environmental conditions are equally suitable for micro-bat activity. The animal rarely attempts to fly during heavy rainstorms, as the intense sound of downpours interferes significantly with its acoustic tracking signals. Rain creates broadband noise across the same frequency ranges the micro-bat uses for echolocation, making it nearly impossible to distinguish the echo of a small insect from the background noise.

It would be incorrect to assume, however, that rain simply reduces the micro-bat's success rate. Under persistent heavy rain conditions, the animal does not merely struggle — it effectively ceases foraging entirely. This is not because its wings are physically damaged by water, which is a common misconception. The membranes that form micro-bat wings are surprisingly resilient and water-resistant. Rather, the suspension of activity is a purely sensory decision driven by the acoustic environment.

Micro-bats typically roost in sheltered locations such as tree hollows, caves, and under the bark of eucalyptus trees. During dry, warm nights, they can consume up to half their own body weight in insects within a single foraging session — a remarkable feat that underscores just how effective echolocation is as a hunting strategy.`,
    questions: [
      {
        id: 'q1',
        text: 'Why does the micro-bat avoid flying during heavy rainstorms?',
        options: [
          { id: 'a', text: 'It cannot see insects clearly in the dark during rain.' },
          { id: 'b', text: 'Rain disrupts the acoustic signals used for echolocation tracking.' },
          { id: 'c', text: 'Heavy rain physically damages the micro-bat\'s wing membranes.' },
          { id: 'd', text: 'The micro-bat prefers to conserve energy during cold, wet weather.' },
        ],
        correctOptionId: 'b',
        idealEvidenceSentence: 'The animal rarely attempts to fly during heavy rainstorms, as the intense sound of downpours interferes significantly with its acoustic tracking signals.',
        explanation: 'The passage explicitly states that rain interferes with acoustic tracking signals, not vision or wing damage.',
      },
      {
        id: 'q2',
        text: 'Which statement about micro-bat wing membranes is supported by the passage?',
        options: [
          { id: 'a', text: 'Wing membranes are fragile and easily torn by water droplets.' },
          { id: 'b', text: 'Wing membranes become waterlogged, adding weight that prevents flight.' },
          { id: 'c', text: 'Wing membranes are resilient and resistant to water damage.' },
          { id: 'd', text: 'Wing membranes are the primary reason micro-bats cannot fly in rain.' },
        ],
        correctOptionId: 'c',
        idealEvidenceSentence: 'The membranes that form micro-bat wings are surprisingly resilient and water-resistant.',
        explanation: 'The passage directly states that wing membranes are "surprisingly resilient and water-resistant" and explicitly calls the idea of water damage a "common misconception".',
      },
      {
        id: 'q3',
        text: 'What does the passage suggest about micro-bat activity during persistent heavy rain?',
        options: [
          { id: 'a', text: 'The micro-bat\'s hunting success is reduced but it continues foraging.' },
          { id: 'b', text: 'The micro-bat switches to hunting larger prey that is easier to detect.' },
          { id: 'c', text: 'The micro-bat ceases foraging entirely rather than continuing with difficulty.' },
          { id: 'd', text: 'The micro-bat relocates to drier areas where insects are more active.' },
        ],
        correctOptionId: 'c',
        idealEvidenceSentence: 'Under persistent heavy rain conditions, the animal does not merely struggle — it effectively ceases foraging entirely.',
        explanation: 'The passage directly contradicts the idea that micro-bats merely struggle. It states they "effectively cease foraging entirely".',
      },
    ],
  },
  {
    id: 'module-2',
    title: 'The Great Barrier Reef in Decline',
    subject: 'Environment & Science',
    difficulty: 'Year 6',
    estimatedMinutes: 15,
    imageUrl: 'https://images.pexels.com/photos/3369526/pexels-photo-3369526.jpeg?w=400&h=250&fit=crop',
    passage: `The Great Barrier Reef, stretching over 2,300 kilometres along the Queensland coastline, is the world's largest coral reef system. It is frequently described as one of the seven natural wonders of the world and supports an extraordinary diversity of marine life. However, the reef is not the thriving ecosystem it once was — it has undergone significant and measurable decline over the past four decades.

Coral bleaching is the primary mechanism driving reef degradation. When ocean temperatures rise even slightly above their seasonal average — sometimes by as little as one degree Celsius — corals expel the symbiotic algae living within their tissues. These algae, known as zooxanthellae, provide corals with up to ninety percent of their energy through photosynthesis. Without them, corals turn stark white and are left in a severely weakened state. Unless the water temperature returns to normal within a few weeks, the coral typically dies.

Mass bleaching events have become disturbingly frequent. Prior to 1998, large-scale bleaching was essentially unrecorded in scientific literature. Since then, the reef has experienced five mass bleaching events, with the events of 2016, 2017, and 2022 being the most severe, affecting portions of the reef that had never been impacted before.

It would be misleading, however, to characterise the entire reef as dead or beyond recovery. Certain deeper, cooler sections remain largely intact. Some coral species have demonstrated a limited capacity to adapt to warmer conditions over multiple generations. Scientists do not claim that all hope is lost — but they are unambiguous that without a significant reduction in global carbon emissions, the reef's long-term survival cannot be guaranteed.

Conservation efforts are underway, including coral restoration programs where heat-tolerant coral fragments are cultivated in nurseries and transplanted to damaged areas. While these programs show genuine promise, experts caution that they cannot substitute for large-scale action on climate change.`,
    questions: [
      {
        id: 'q1',
        text: 'What triggers coral bleaching, according to the passage?',
        options: [
          { id: 'a', text: 'A significant drop in ocean salinity caused by increased rainfall.' },
          { id: 'b', text: 'A slight increase in ocean temperature above the seasonal average.' },
          { id: 'c', text: 'The complete absence of sunlight in deeper reef sections.' },
          { id: 'd', text: 'Direct physical damage to coral structures from storm activity.' },
        ],
        correctOptionId: 'b',
        idealEvidenceSentence: 'When ocean temperatures rise even slightly above their seasonal average — sometimes by as little as one degree Celsius — corals expel the symbiotic algae living within their tissues.',
        explanation: 'The passage specifies that even a slight temperature rise (as little as one degree) above seasonal average triggers bleaching.',
      },
      {
        id: 'q2',
        text: 'Which statement most accurately reflects the passage\'s position on reef recovery?',
        options: [
          { id: 'a', text: 'The entire reef is beyond recovery and will be lost within decades.' },
          { id: 'b', text: 'Scientists are confident that coral restoration programs will save the reef.' },
          { id: 'c', text: 'Some sections remain intact and limited adaptation has been observed, but long-term survival is uncertain without emission reductions.' },
          { id: 'd', text: 'Deeper sections of the reef are completely unaffected by rising temperatures.' },
        ],
        correctOptionId: 'c',
        idealEvidenceSentence: 'Scientists do not claim that all hope is lost — but they are unambiguous that without a significant reduction in global carbon emissions, the reef\'s long-term survival cannot be guaranteed.',
        explanation: 'The passage presents a nuanced view — neither all hope lost nor full recovery guaranteed. The key condition is carbon emission reductions.',
      },
      {
        id: 'q3',
        text: 'What does the passage state about mass bleaching events before 1998?',
        options: [
          { id: 'a', text: 'Mass bleaching events occurred regularly but were not considered serious.' },
          { id: 'b', text: 'Mass bleaching was frequently documented but largely ignored by scientists.' },
          { id: 'c', text: 'Large-scale bleaching was essentially unrecorded in scientific literature.' },
          { id: 'd', text: 'Bleaching events before 1998 affected the same areas as those in 2016.' },
        ],
        correctOptionId: 'c',
        idealEvidenceSentence: 'Prior to 1998, large-scale bleaching was essentially unrecorded in scientific literature.',
        explanation: 'The passage explicitly states that before 1998, large-scale bleaching was "essentially unrecorded" — not merely uncommon or ignored.',
      },
    ],
  },
  {
    id: 'module-3',
    title: 'The Rise of Urban Vertical Gardens',
    subject: 'Society & Technology',
    difficulty: 'Year 4',
    estimatedMinutes: 10,
    imageUrl: 'https://images.pexels.com/photos/1232641/pexels-photo-1232641.jpeg?w=400&h=250&fit=crop',
    passage: `In cities around the world, a quiet revolution in urban agriculture is taking hold. Vertical gardens — also known as living walls — are appearing on the sides of office buildings, in shopping centres, and even inside schools and hospitals. These installations use specially designed panels or frames to hold soil, hydroponic trays, or growing media, allowing plants to grow upward across a wall surface rather than outward across a field.

Vertical gardens offer several advantages over traditional farming, though not without important limitations. A single square metre of vertical garden can support significantly more plant growth than the equivalent area of flat ground, simply because plants are layered vertically. This space efficiency makes vertical gardens particularly valuable in dense urban environments where land is expensive and scarce.

The environmental benefits are also notable. Plants in vertical gardens help reduce the "urban heat island" effect — the tendency for cities to be warmer than surrounding rural areas due to heat absorbed by concrete and asphalt. A well-planted living wall can reduce a building's surface temperature by several degrees, lowering the energy required for air conditioning.

However, vertical gardens are not universally practical or cost-effective. The installation costs are substantially higher than traditional garden beds. Water and nutrient delivery systems require regular maintenance. Not every plant species is suitable — those with deep root systems or very large canopies rarely thrive in vertical configurations.

Despite these challenges, interest in vertical gardens continues to grow. Urban planners and architects increasingly regard them not merely as decorative features, but as functional components of sustainable city design. Several Australian cities have begun incorporating living wall requirements into building approval standards for new commercial developments.`,
    questions: [
      {
        id: 'q1',
        text: 'Why are vertical gardens described as space-efficient in the passage?',
        options: [
          { id: 'a', text: 'They use less water than traditional gardens because plants share nutrients.' },
          { id: 'b', text: 'They allow plants to grow upward, supporting more growth per square metre than flat ground.' },
          { id: 'c', text: 'They eliminate the need for soil, making them lighter and easier to maintain.' },
          { id: 'd', text: 'They can be installed on rooftops where no other farming is possible.' },
        ],
        correctOptionId: 'b',
        idealEvidenceSentence: 'A single square metre of vertical garden can support significantly more plant growth than the equivalent area of flat ground, simply because plants are layered vertically.',
        explanation: 'The passage directly states that layering plants vertically means more growth per square metre compared to flat ground.',
      },
      {
        id: 'q2',
        text: 'Which types of plants does the passage indicate are NOT well-suited to vertical gardens?',
        options: [
          { id: 'a', text: 'Plants that require direct sunlight for more than six hours per day.' },
          { id: 'b', text: 'Plants that are native to Australian environments and conditions.' },
          { id: 'c', text: 'Plants with deep root systems or very large canopies.' },
          { id: 'd', text: 'All plants that normally grow in flat, traditional garden beds.' },
        ],
        correctOptionId: 'c',
        idealEvidenceSentence: 'Not every plant species is suitable — those with deep root systems or very large canopies rarely thrive in vertical configurations.',
        explanation: 'The passage explicitly names plants with deep root systems or large canopies as those that rarely thrive in vertical gardens.',
      },
      {
        id: 'q3',
        text: 'How does the passage characterise urban planners\' current view of vertical gardens?',
        options: [
          { id: 'a', text: 'As expensive novelties that are unlikely to become standard practice.' },
          { id: 'b', text: 'As functional components of sustainable city design, not merely decorative.' },
          { id: 'c', text: 'As the most important solution to the urban heat island problem.' },
          { id: 'd', text: 'As a promising idea that has never been successfully implemented at scale.' },
        ],
        correctOptionId: 'b',
        idealEvidenceSentence: 'Urban planners and architects increasingly regard them not merely as decorative features, but as functional components of sustainable city design.',
        explanation: 'The passage explicitly states that urban planners now regard vertical gardens as "functional components of sustainable city design, not merely decorative".',
      },
    ],
  },
];

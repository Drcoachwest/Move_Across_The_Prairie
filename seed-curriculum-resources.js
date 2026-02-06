// Seed script to populate curriculum resources with PE-specific content
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding curriculum resources...');

  // Elementary Resources (K-2)
  const elementaryK2Resources = [
    {
      title: 'Locomotor Skills Unit Overview',
      description: 'Comprehensive guide to teaching basic locomotor movements like walking, running, hopping, and skipping for early elementary.',
      band: 'ELEMENTARY',
      grade: 'K-2',
      unit: 'Locomotor Skills',
      subject: 'Physical Education',
      tags: 'movement,locomotor,fundamental skills',
      type: 'link',
      externalUrl: 'https://docs.google.com/document/d/sample-locomotor-k2',
      createdBy: 'admin',
    },
    {
      title: 'Ball Skills Progression - Primary',
      description: 'Age-appropriate ball handling activities and progressions for K-2 students.',
      band: 'ELEMENTARY',
      grade: 'K-2',
      unit: 'Manipulative Skills',
      subject: 'Physical Education',
      tags: 'ball skills,manipulatives,coordination',
      type: 'link',
      externalUrl: 'https://docs.google.com/document/d/sample-ball-skills-k2',
      createdBy: 'admin',
    },
    {
      title: 'Fitness Fun Activities',
      description: 'Engaging fitness activities designed for K-2 students to build strength and endurance.',
      band: 'ELEMENTARY',
      grade: 'K-2',
      unit: 'Fitness',
      subject: 'Physical Education',
      tags: 'fitness,games,fun',
      type: 'link',
      externalUrl: 'https://docs.google.com/document/d/sample-fitness-k2',
      createdBy: 'admin',
    },
  ];

  // Elementary Resources (3-5)
  const elementary35Resources = [
    {
      title: 'Invasion Games Unit Plan',
      description: 'Complete unit plan for teaching invasion games concepts including soccer, basketball, and ultimate frisbee basics.',
      band: 'ELEMENTARY',
      grade: '3-5',
      unit: 'Invasion Games',
      subject: 'Physical Education',
      tags: 'games,strategy,teamwork,invasion',
      type: 'link',
      externalUrl: 'https://docs.google.com/document/d/sample-invasion-35',
      createdBy: 'admin',
    },
    {
      title: 'Striking and Fielding Games',
      description: 'Lessons and activities for teaching striking skills using bats, paddles, and various implements.',
      band: 'ELEMENTARY',
      grade: '3-5',
      unit: 'Striking',
      subject: 'Physical Education',
      tags: 'striking,batting,games',
      type: 'link',
      externalUrl: 'https://docs.google.com/document/d/sample-striking-35',
      createdBy: 'admin',
    },
    {
      title: 'FitnessGram Preparation Guide',
      description: 'How to prepare 3rd-5th graders for FitnessGram testing with practice activities and protocols.',
      band: 'ELEMENTARY',
      grade: '3-5',
      unit: 'Fitness',
      subject: 'Physical Education',
      tags: 'fitnessgram,testing,health',
      type: 'link',
      externalUrl: 'https://docs.google.com/document/d/sample-fitnessgram-35',
      createdBy: 'admin',
    },
    {
      title: 'Dance and Rhythm Activities',
      description: 'Creative movement and dance activities aligned with state standards for upper elementary.',
      band: 'ELEMENTARY',
      grade: '3-5',
      unit: 'Rhythmic Activities',
      subject: 'Physical Education',
      tags: 'dance,rhythm,movement',
      type: 'link',
      externalUrl: 'https://docs.google.com/document/d/sample-dance-35',
      createdBy: 'admin',
    },
  ];

  // Middle School Resources (6-8)
  const middle68Resources = [
    {
      title: 'Team Sports Skills Development',
      description: 'Progressive skill development for basketball, volleyball, and soccer at the middle school level.',
      band: 'MIDDLE',
      grade: '6-8',
      unit: 'Team Sports',
      subject: 'Physical Education',
      tags: 'team sports,skills,competition',
      type: 'link',
      externalUrl: 'https://docs.google.com/document/d/sample-team-sports-68',
      createdBy: 'admin',
    },
    {
      title: 'Fitness Training Fundamentals',
      description: 'Introduction to strength training, cardiovascular fitness, and personal fitness planning.',
      band: 'MIDDLE',
      grade: '6-8',
      unit: 'Fitness',
      subject: 'Physical Education',
      tags: 'fitness,training,health,wellness',
      type: 'link',
      externalUrl: 'https://docs.google.com/document/d/sample-fitness-68',
      createdBy: 'admin',
    },
    {
      title: 'Outdoor Education Activities',
      description: 'Outdoor pursuits including orienteering, hiking preparation, and adventure activities.',
      band: 'MIDDLE',
      grade: '6-8',
      unit: 'Outdoor Education',
      subject: 'Physical Education',
      tags: 'outdoor,adventure,nature',
      type: 'link',
      externalUrl: 'https://docs.google.com/document/d/sample-outdoor-68',
      createdBy: 'admin',
    },
  ];

  // High School Resources (9-12)
  const high912Resources = [
    {
      title: 'Advanced Team Tactics',
      description: 'Advanced strategies and tactics for competitive team sports at the high school level.',
      band: 'HIGH',
      grade: '9-12',
      unit: 'Team Sports',
      subject: 'Physical Education',
      tags: 'advanced,tactics,strategy,competition',
      type: 'link',
      externalUrl: 'https://docs.google.com/document/d/sample-tactics-912',
      createdBy: 'admin',
    },
    {
      title: 'Personal Fitness Programming',
      description: 'Creating individualized fitness plans with goal setting and progression tracking.',
      band: 'HIGH',
      grade: '9-12',
      unit: 'Fitness',
      subject: 'Physical Education',
      tags: 'fitness,personal training,goals',
      type: 'link',
      externalUrl: 'https://docs.google.com/document/d/sample-fitness-912',
      createdBy: 'admin',
    },
    {
      title: 'Lifetime Recreation Activities',
      description: 'Introduction to recreational activities that promote lifelong physical activity.',
      band: 'HIGH',
      grade: '9-12',
      unit: 'Lifetime Activities',
      subject: 'Physical Education',
      tags: 'recreation,lifetime,activities',
      type: 'link',
      externalUrl: 'https://docs.google.com/document/d/sample-recreation-912',
      createdBy: 'admin',
    },
  ];

  // Combine all resources
  const allResources = [
    ...elementaryK2Resources,
    ...elementary35Resources,
    ...middle68Resources,
    ...high912Resources,
  ];

  // Insert resources
  let created = 0;
  for (const resource of allResources) {
    try {
      await prisma.curriculumResource.create({
        data: resource,
      });
      created++;
      console.log(`✓ Created: ${resource.title}`);
    } catch (error) {
      console.log(`⚠ Skipped (may already exist): ${resource.title}`);
    }
  }

  console.log(`\n✅ Seeding complete! Created ${created} new resources.`);
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

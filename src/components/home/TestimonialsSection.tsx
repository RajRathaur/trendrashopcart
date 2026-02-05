import { motion } from 'framer-motion';
import { Star, Quote } from 'lucide-react';
import { ScrollReveal, StaggerContainer, StaggerItem } from '@/components/ui/scroll-reveal';

const testimonials = [
  {
    id: 1,
    name: 'Priya Sharma',
    location: 'Mumbai',
    avatar: 'PS',
    rating: 5,
    text: 'Amazing quality products at unbeatable prices! The delivery was super fast and the packaging was excellent.',
    gradient: 'from-pink-500 to-rose-500',
  },
  {
    id: 2,
    name: 'Rahul Verma',
    location: 'Delhi',
    avatar: 'RV',
    rating: 5,
    text: 'I\'ve been shopping here for 2 years. Best customer service and genuine products every single time!',
    gradient: 'from-blue-500 to-cyan-500',
  },
  {
    id: 3,
    name: 'Ananya Patel',
    location: 'Bangalore',
    avatar: 'AP',
    rating: 5,
    text: 'The deals are incredible! Got my favorite electronics at 50% off. Highly recommend Trendra!',
    gradient: 'from-purple-500 to-pink-500',
  },
];

export const TestimonialsSection = () => {
  return (
    <section className="py-12">
      <ScrollReveal variant="fadeUp">
        <div className="text-center mb-10">
          <h2 className="section-title justify-center text-2xl md:text-3xl">
            What Our Customers Say
          </h2>
          <p className="text-muted-foreground mt-2">
            Join thousands of happy shoppers
          </p>
        </div>
      </ScrollReveal>

      <StaggerContainer className="grid grid-cols-1 md:grid-cols-3 gap-6" staggerDelay={0.15}>
        {testimonials.map((testimonial) => (
          <StaggerItem key={testimonial.id}>
            <motion.div
              whileHover={{ y: -8 }}
              transition={{ type: 'spring', stiffness: 300 }}
              className="bg-card rounded-2xl p-6 shadow-sm border border-border/50 h-full relative overflow-hidden group"
            >
              {/* Quote icon */}
              <Quote className="absolute top-4 right-4 h-8 w-8 text-muted/20 group-hover:text-primary/20 transition-colors" />
              
              {/* Rating */}
              <div className="flex gap-1 mb-4">
                {Array.from({ length: testimonial.rating }).map((_, i) => (
                  <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                ))}
              </div>

              {/* Text */}
              <p className="text-foreground mb-6 leading-relaxed">
                "{testimonial.text}"
              </p>

              {/* Author */}
              <div className="flex items-center gap-3">
                <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${testimonial.gradient} flex items-center justify-center text-white font-bold`}>
                  {testimonial.avatar}
                </div>
                <div>
                  <div className="font-semibold text-foreground">{testimonial.name}</div>
                  <div className="text-sm text-muted-foreground">{testimonial.location}</div>
                </div>
              </div>
            </motion.div>
          </StaggerItem>
        ))}
      </StaggerContainer>
    </section>
  );
};

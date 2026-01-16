import { motion } from "framer-motion";
import { Star, Quote } from "lucide-react";

const testimonials = [
  {
    name: "Rahul Sharma",
    branch: "Computer Engineering",
    image: "https://api.dicebear.com/7.x/avataaars/svg?seed=rahul",
    rating: 5,
    text: "This platform transformed my understanding of engineering drawing. The AI feedback is incredibly helpful!",
  },
  {
    name: "Priya Patel",
    branch: "Data Science",
    image: "https://api.dicebear.com/7.x/avataaars/svg?seed=priya",
    rating: 5,
    text: "The PYQ collection and video tutorials helped me score 95% in my engineering drawing exam.",
  },
  {
    name: "Amit Kumar",
    branch: "Electronics & Communication",
    image: "https://api.dicebear.com/7.x/avataaars/svg?seed=amit",
    rating: 5,
    text: "Best resource for engineering drawing practice. The 3D models made complex concepts easy to understand.",
  },
];

const Testimonials = () => {
  return (
    <section className="relative py-20 overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-muted/50 via-muted/30 to-transparent" />
      <div className="absolute inset-0 blueprint-dots opacity-10" />
      
      <div className="relative container mx-auto px-4">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-14"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary font-mono text-sm mb-6">
            <Star className="w-4 h-4 fill-primary" />
            Student Reviews
          </div>
          <h2 className="font-mono text-2xl md:text-4xl font-bold mb-4">
            What Our <span className="gradient-text">Students Say</span>
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Join thousands of students who have mastered engineering drawing with our platform
          </p>
        </motion.div>

        {/* Testimonial Cards */}
        <div className="grid md:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {testimonials.map((testimonial, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              whileHover={{ y: -5 }}
              className="group relative"
            >
              {/* Glow effect */}
              <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-secondary/20 rounded-2xl blur-xl opacity-0 group-hover:opacity-50 transition-opacity duration-500" />
              
              {/* Card */}
              <div className="relative p-6 rounded-2xl bg-card/90 backdrop-blur-sm border border-border/50 hover:border-primary/30 transition-all duration-300 h-full flex flex-col">
                {/* Quote icon */}
                <div className="absolute -top-3 -right-3 p-2 rounded-full bg-primary/10 border border-primary/20">
                  <Quote className="w-4 h-4 text-primary" />
                </div>

                {/* Stars */}
                <div className="flex gap-1 mb-4">
                  {Array.from({ length: testimonial.rating }).map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
                  ))}
                </div>

                {/* Text */}
                <p className="text-muted-foreground leading-relaxed mb-6 flex-grow">
                  "{testimonial.text}"
                </p>

                {/* Author */}
                <div className="flex items-center gap-3 pt-4 border-t border-border/50">
                  <img
                    src={testimonial.image}
                    alt={testimonial.name}
                    className="w-12 h-12 rounded-full bg-muted"
                  />
                  <div>
                    <h4 className="font-mono font-semibold text-foreground">
                      {testimonial.name}
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      {testimonial.branch}
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto"
        >
          {[
            { value: "500+", label: "Active Students" },
            { value: "100+", label: "PYQ Papers" },
            { value: "50+", label: "Video Tutorials" },
            { value: "95%", label: "Success Rate" },
          ].map((stat, index) => (
            <div key={index} className="text-center p-4">
              <div className="font-mono text-3xl md:text-4xl font-bold gradient-text mb-2">
                {stat.value}
              </div>
              <div className="text-sm text-muted-foreground">{stat.label}</div>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};

export default Testimonials;

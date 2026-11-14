export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      admin_audit_logs: {
        Row: {
          action: string
          admin_id: string
          created_at: string
          entity_id: string | null
          entity_type: string
          id: string
          metadata: Json
        }
        Insert: {
          action: string
          admin_id: string
          created_at?: string
          entity_id?: string | null
          entity_type: string
          id?: string
          metadata?: Json
        }
        Update: {
          action?: string
          admin_id?: string
          created_at?: string
          entity_id?: string | null
          entity_type?: string
          id?: string
          metadata?: Json
        }
        Relationships: []
      }
      ai_tryon_usage: {
        Row: {
          created_at: string
          id: string
          product_id: string
          status: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          product_id: string
          status?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          product_id?: string
          status?: string
          user_id?: string
        }
        Relationships: []
      }
      banners: {
        Row: {
          created_at: string
          id: string
          image_url: string
          is_active: boolean | null
          link_url: string | null
          sort_order: number | null
          title: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          image_url: string
          is_active?: boolean | null
          link_url?: string | null
          sort_order?: number | null
          title?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          image_url?: string
          is_active?: boolean | null
          link_url?: string | null
          sort_order?: number | null
          title?: string | null
        }
        Relationships: []
      }
      bazaar_conversations: {
        Row: {
          buyer_id: string
          buyer_name: string
          buyer_unread: number
          created_at: string
          id: string
          last_message: string | null
          last_message_at: string
          listing_id: string
          listing_image: string | null
          listing_title: string
          seller_id: string
          seller_name: string
          seller_unread: number
        }
        Insert: {
          buyer_id: string
          buyer_name?: string
          buyer_unread?: number
          created_at?: string
          id?: string
          last_message?: string | null
          last_message_at?: string
          listing_id: string
          listing_image?: string | null
          listing_title?: string
          seller_id: string
          seller_name?: string
          seller_unread?: number
        }
        Update: {
          buyer_id?: string
          buyer_name?: string
          buyer_unread?: number
          created_at?: string
          id?: string
          last_message?: string | null
          last_message_at?: string
          listing_id?: string
          listing_image?: string | null
          listing_title?: string
          seller_id?: string
          seller_name?: string
          seller_unread?: number
        }
        Relationships: [
          {
            foreignKeyName: "bazaar_conversations_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "bazaar_listings"
            referencedColumns: ["id"]
          },
        ]
      }
      bazaar_listings: {
        Row: {
          admin_note: string | null
          approved_at: string | null
          category: string
          city: string
          condition: string
          created_at: string
          description: string
          id: string
          images: string[]
          price: number
          seller_name: string
          state: string | null
          status: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          admin_note?: string | null
          approved_at?: string | null
          category?: string
          city: string
          condition?: string
          created_at?: string
          description?: string
          id?: string
          images?: string[]
          price: number
          seller_name?: string
          state?: string | null
          status?: string
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          admin_note?: string | null
          approved_at?: string | null
          category?: string
          city?: string
          condition?: string
          created_at?: string
          description?: string
          id?: string
          images?: string[]
          price?: number
          seller_name?: string
          state?: string | null
          status?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      bazaar_messages: {
        Row: {
          body: string
          conversation_id: string
          created_at: string
          id: string
          sender_id: string
        }
        Insert: {
          body: string
          conversation_id: string
          created_at?: string
          id?: string
          sender_id: string
        }
        Update: {
          body?: string
          conversation_id?: string
          created_at?: string
          id?: string
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "bazaar_messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "bazaar_conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      cart_items: {
        Row: {
          color: string | null
          created_at: string
          id: string
          print_design: Json | null
          product_id: string
          quantity: number | null
          size: string | null
          user_id: string
        }
        Insert: {
          color?: string | null
          created_at?: string
          id?: string
          print_design?: Json | null
          product_id: string
          quantity?: number | null
          size?: string | null
          user_id: string
        }
        Update: {
          color?: string | null
          created_at?: string
          id?: string
          print_design?: Json | null
          product_id?: string
          quantity?: number | null
          size?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "cart_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      categories: {
        Row: {
          created_at: string
          description: string | null
          id: string
          image_url: string | null
          is_active: boolean | null
          name: string
          parent_id: string | null
          slug: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          name: string
          parent_id?: string | null
          slug: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          name?: string
          parent_id?: string | null
          slug?: string
        }
        Relationships: [
          {
            foreignKeyName: "categories_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_messages: {
        Row: {
          content: Json
          created_at: string
          id: string
          role: string
          thread_id: string
          user_id: string
        }
        Insert: {
          content: Json
          created_at?: string
          id?: string
          role: string
          thread_id: string
          user_id: string
        }
        Update: {
          content?: Json
          created_at?: string
          id?: string
          role?: string
          thread_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_messages_thread_id_fkey"
            columns: ["thread_id"]
            isOneToOne: false
            referencedRelation: "chat_threads"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_threads: {
        Row: {
          created_at: string
          id: string
          last_message_at: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          last_message_at?: string
          title?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          last_message_at?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      coin_earn_log: {
        Row: {
          coins_delta: number
          created_at: string
          id: string
          user_id: string
        }
        Insert: {
          coins_delta: number
          created_at?: string
          id?: string
          user_id: string
        }
        Update: {
          coins_delta?: number
          created_at?: string
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      coin_purchases: {
        Row: {
          amount_inr: number
          coins: number
          created_at: string
          id: string
          razorpay_order_id: string
          razorpay_payment_id: string | null
          status: string
          user_id: string
        }
        Insert: {
          amount_inr: number
          coins: number
          created_at?: string
          id?: string
          razorpay_order_id: string
          razorpay_payment_id?: string | null
          status?: string
          user_id: string
        }
        Update: {
          amount_inr?: number
          coins?: number
          created_at?: string
          id?: string
          razorpay_order_id?: string
          razorpay_payment_id?: string | null
          status?: string
          user_id?: string
        }
        Relationships: []
      }
      coin_wallet: {
        Row: {
          balance: number
          created_at: string
          id: string
          total_earned: number
          updated_at: string
          user_id: string
        }
        Insert: {
          balance?: number
          created_at?: string
          id?: string
          total_earned?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          balance?: number
          created_at?: string
          id?: string
          total_earned?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      contact_messages: {
        Row: {
          created_at: string
          email: string
          id: string
          is_read: boolean
          message: string
          name: string
          phone: string | null
          subject: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          is_read?: boolean
          message: string
          name: string
          phone?: string | null
          subject?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          is_read?: boolean
          message?: string
          name?: string
          phone?: string | null
          subject?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      coupons: {
        Row: {
          code: string
          created_at: string
          description: string | null
          discount_type: string
          discount_value: number
          expires_at: string | null
          id: string
          is_active: boolean | null
          max_discount_amount: number | null
          min_order_amount: number | null
          usage_limit: number | null
          used_count: number | null
        }
        Insert: {
          code: string
          created_at?: string
          description?: string | null
          discount_type?: string
          discount_value: number
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          max_discount_amount?: number | null
          min_order_amount?: number | null
          usage_limit?: number | null
          used_count?: number | null
        }
        Update: {
          code?: string
          created_at?: string
          description?: string | null
          discount_type?: string
          discount_value?: number
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          max_discount_amount?: number | null
          min_order_amount?: number | null
          usage_limit?: number | null
          used_count?: number | null
        }
        Relationships: []
      }
      creator_monetization: {
        Row: {
          admin_note: string | null
          created_at: string
          full_name: string
          status: string
          updated_at: string
          upi_id: string
          user_id: string
        }
        Insert: {
          admin_note?: string | null
          created_at?: string
          full_name: string
          status?: string
          updated_at?: string
          upi_id: string
          user_id: string
        }
        Update: {
          admin_note?: string | null
          created_at?: string
          full_name?: string
          status?: string
          updated_at?: string
          upi_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "creator_monetization_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "social_profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      creator_payouts: {
        Row: {
          amount: number
          created_at: string
          created_by: string | null
          id: string
          reference: string
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          created_by?: string | null
          id?: string
          reference?: string
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          created_by?: string | null
          id?: string
          reference?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "creator_payouts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "social_profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      delivery_pincodes: {
        Row: {
          city: string | null
          created_at: string
          delivery_charge: number
          delivery_days: number | null
          id: string
          is_active: boolean | null
          is_cod_available: boolean | null
          pincode: string
          state: string | null
        }
        Insert: {
          city?: string | null
          created_at?: string
          delivery_charge?: number
          delivery_days?: number | null
          id?: string
          is_active?: boolean | null
          is_cod_available?: boolean | null
          pincode: string
          state?: string | null
        }
        Update: {
          city?: string | null
          created_at?: string
          delivery_charge?: number
          delivery_days?: number | null
          id?: string
          is_active?: boolean | null
          is_cod_available?: boolean | null
          pincode?: string
          state?: string | null
        }
        Relationships: []
      }
      email_alert_state: {
        Row: {
          id: number
          last_alert_at: string | null
          last_alerted_log_id: string | null
          updated_at: string
        }
        Insert: {
          id?: number
          last_alert_at?: string | null
          last_alerted_log_id?: string | null
          updated_at?: string
        }
        Update: {
          id?: number
          last_alert_at?: string | null
          last_alerted_log_id?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      email_send_log: {
        Row: {
          created_at: string
          error_message: string | null
          id: string
          message_id: string | null
          metadata: Json | null
          recipient_email: string
          status: string
          template_name: string
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          id?: string
          message_id?: string | null
          metadata?: Json | null
          recipient_email: string
          status: string
          template_name: string
        }
        Update: {
          created_at?: string
          error_message?: string | null
          id?: string
          message_id?: string | null
          metadata?: Json | null
          recipient_email?: string
          status?: string
          template_name?: string
        }
        Relationships: []
      }
      email_send_state: {
        Row: {
          auth_email_ttl_minutes: number
          batch_size: number
          id: number
          retry_after_until: string | null
          send_delay_ms: number
          transactional_email_ttl_minutes: number
          updated_at: string
        }
        Insert: {
          auth_email_ttl_minutes?: number
          batch_size?: number
          id?: number
          retry_after_until?: string | null
          send_delay_ms?: number
          transactional_email_ttl_minutes?: number
          updated_at?: string
        }
        Update: {
          auth_email_ttl_minutes?: number
          batch_size?: number
          id?: number
          retry_after_until?: string | null
          send_delay_ms?: number
          transactional_email_ttl_minutes?: number
          updated_at?: string
        }
        Relationships: []
      }
      email_unsubscribe_tokens: {
        Row: {
          created_at: string
          email: string
          id: string
          token: string
          used_at: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          token: string
          used_at?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          token?: string
          used_at?: string | null
        }
        Relationships: []
      }
      game_rewards: {
        Row: {
          coupon_code: string
          created_at: string
          discount_percent: number
          expires_at: string
          game_score: number
          id: string
          is_redeemed: boolean
          user_id: string
        }
        Insert: {
          coupon_code: string
          created_at?: string
          discount_percent: number
          expires_at?: string
          game_score: number
          id?: string
          is_redeemed?: boolean
          user_id: string
        }
        Update: {
          coupon_code?: string
          created_at?: string
          discount_percent?: number
          expires_at?: string
          game_score?: number
          id?: string
          is_redeemed?: boolean
          user_id?: string
        }
        Relationships: []
      }
      internal_job_tokens: {
        Row: {
          created_at: string
          name: string
          token: string
        }
        Insert: {
          created_at?: string
          name: string
          token?: string
        }
        Update: {
          created_at?: string
          name?: string
          token?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          created_at: string
          id: string
          is_read: boolean
          message: string
          order_id: string | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_read?: boolean
          message: string
          order_id?: string | null
          title: string
          type?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_read?: boolean
          message?: string
          order_id?: string | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      order_items: {
        Row: {
          color: string | null
          created_at: string
          id: string
          order_id: string
          price: number
          print_design: Json | null
          product_id: string | null
          product_image: string | null
          product_name: string
          quantity: number
          seller_id: string | null
          size: string | null
        }
        Insert: {
          color?: string | null
          created_at?: string
          id?: string
          order_id: string
          price: number
          print_design?: Json | null
          product_id?: string | null
          product_image?: string | null
          product_name: string
          quantity: number
          seller_id?: string | null
          size?: string | null
        }
        Update: {
          color?: string | null
          created_at?: string
          id?: string
          order_id?: string
          price?: number
          print_design?: Json | null
          product_id?: string | null
          product_image?: string | null
          product_name?: string
          quantity?: number
          seller_id?: string | null
          size?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "sellers"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          cod_confirmed: boolean | null
          courier_name: string | null
          created_at: string
          delivery_fee: number
          delivery_latitude: number | null
          delivery_location_accuracy: number | null
          delivery_longitude: number | null
          id: string
          notes: string | null
          order_number: string
          payment_method: string | null
          shipping_address: string
          shipping_city: string
          shipping_phone: string
          shipping_pincode: string
          shipping_state: string
          status: Database["public"]["Enums"]["order_status"] | null
          total_amount: number
          tracking_number: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          cod_confirmed?: boolean | null
          courier_name?: string | null
          created_at?: string
          delivery_fee?: number
          delivery_latitude?: number | null
          delivery_location_accuracy?: number | null
          delivery_longitude?: number | null
          id?: string
          notes?: string | null
          order_number: string
          payment_method?: string | null
          shipping_address: string
          shipping_city: string
          shipping_phone: string
          shipping_pincode: string
          shipping_state: string
          status?: Database["public"]["Enums"]["order_status"] | null
          total_amount: number
          tracking_number?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          cod_confirmed?: boolean | null
          courier_name?: string | null
          created_at?: string
          delivery_fee?: number
          delivery_latitude?: number | null
          delivery_location_accuracy?: number | null
          delivery_longitude?: number | null
          id?: string
          notes?: string | null
          order_number?: string
          payment_method?: string | null
          shipping_address?: string
          shipping_city?: string
          shipping_phone?: string
          shipping_pincode?: string
          shipping_state?: string
          status?: Database["public"]["Enums"]["order_status"] | null
          total_amount?: number
          tracking_number?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      payment_confirmations: {
        Row: {
          admin_notes: string | null
          created_at: string
          customer_name: string
          delivery_address: string
          id: string
          payment_amount: number
          phone_number: string
          product_id: string | null
          product_name: string
          screenshot_url: string
          status: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          admin_notes?: string | null
          created_at?: string
          customer_name: string
          delivery_address: string
          id?: string
          payment_amount: number
          phone_number: string
          product_id?: string | null
          product_name: string
          screenshot_url: string
          status?: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          admin_notes?: string | null
          created_at?: string
          customer_name?: string
          delivery_address?: string
          id?: string
          payment_amount?: number
          phone_number?: string
          product_id?: string | null
          product_name?: string
          screenshot_url?: string
          status?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payment_confirmations_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      phone_otps: {
        Row: {
          attempts: number
          created_at: string
          expires_at: string
          id: string
          otp_hash: string
          phone: string
          verified: boolean
        }
        Insert: {
          attempts?: number
          created_at?: string
          expires_at?: string
          id?: string
          otp_hash: string
          phone: string
          verified?: boolean
        }
        Update: {
          attempts?: number
          created_at?: string
          expires_at?: string
          id?: string
          otp_hash?: string
          phone?: string
          verified?: boolean
        }
        Relationships: []
      }
      product_reviews: {
        Row: {
          comment: string | null
          created_at: string
          id: string
          images: string[] | null
          is_verified_purchase: boolean | null
          product_id: string
          rating: number
          title: string | null
          user_id: string
        }
        Insert: {
          comment?: string | null
          created_at?: string
          id?: string
          images?: string[] | null
          is_verified_purchase?: boolean | null
          product_id: string
          rating: number
          title?: string | null
          user_id: string
        }
        Update: {
          comment?: string | null
          created_at?: string
          id?: string
          images?: string[] | null
          is_verified_purchase?: boolean | null
          product_id?: string
          rating?: number
          title?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_reviews_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          category_id: string | null
          cod_available: boolean
          colors: string[] | null
          created_at: string
          customization_enabled: boolean
          delivery_charge: number | null
          description: string | null
          discount_percent: number | null
          free_delivery: boolean
          id: string
          images: string[] | null
          is_active: boolean | null
          is_featured: boolean | null
          mrp: number
          name: string
          price: number
          price_tiers: Json
          product_type: string | null
          rating: number | null
          review_count: number | null
          seller_id: string
          sizes: string[] | null
          slug: string
          specifications: Json | null
          stock: number | null
          updated_at: string
        }
        Insert: {
          category_id?: string | null
          cod_available?: boolean
          colors?: string[] | null
          created_at?: string
          customization_enabled?: boolean
          delivery_charge?: number | null
          description?: string | null
          discount_percent?: number | null
          free_delivery?: boolean
          id?: string
          images?: string[] | null
          is_active?: boolean | null
          is_featured?: boolean | null
          mrp: number
          name: string
          price: number
          price_tiers?: Json
          product_type?: string | null
          rating?: number | null
          review_count?: number | null
          seller_id: string
          sizes?: string[] | null
          slug: string
          specifications?: Json | null
          stock?: number | null
          updated_at?: string
        }
        Update: {
          category_id?: string | null
          cod_available?: boolean
          colors?: string[] | null
          created_at?: string
          customization_enabled?: boolean
          delivery_charge?: number | null
          description?: string | null
          discount_percent?: number | null
          free_delivery?: boolean
          id?: string
          images?: string[] | null
          is_active?: boolean | null
          is_featured?: boolean | null
          mrp?: number
          name?: string
          price?: number
          price_tiers?: Json
          product_type?: string | null
          rating?: number | null
          review_count?: number | null
          seller_id?: string
          sizes?: string[] | null
          slug?: string
          specifications?: Json | null
          stock?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "products_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "products_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "sellers"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          address: string | null
          avatar_url: string | null
          city: string | null
          created_at: string
          full_name: string | null
          id: string
          is_blocked: boolean | null
          phone: string | null
          pincode: string | null
          state: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          address?: string | null
          avatar_url?: string | null
          city?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          is_blocked?: boolean | null
          phone?: string | null
          pincode?: string | null
          state?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          address?: string | null
          avatar_url?: string | null
          city?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          is_blocked?: boolean | null
          phone?: string | null
          pincode?: string | null
          state?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      redeem_requests: {
        Row: {
          admin_notes: string | null
          amount_inr: number
          coins_spent: number
          contact_email: string | null
          created_at: string
          google_play_code: string | null
          id: string
          redeem_type: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          admin_notes?: string | null
          amount_inr: number
          coins_spent: number
          contact_email?: string | null
          created_at?: string
          google_play_code?: string | null
          id?: string
          redeem_type?: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          admin_notes?: string | null
          amount_inr?: number
          coins_spent?: number
          contact_email?: string | null
          created_at?: string
          google_play_code?: string | null
          id?: string
          redeem_type?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      reel_comments: {
        Row: {
          body: string
          created_at: string
          id: string
          reel_id: string
          user_id: string
        }
        Insert: {
          body: string
          created_at?: string
          id?: string
          reel_id: string
          user_id: string
        }
        Update: {
          body?: string
          created_at?: string
          id?: string
          reel_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reel_comments_reel_id_fkey"
            columns: ["reel_id"]
            isOneToOne: false
            referencedRelation: "reels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reel_comments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "social_profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      reel_likes: {
        Row: {
          created_at: string
          reel_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          reel_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          reel_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reel_likes_reel_id_fkey"
            columns: ["reel_id"]
            isOneToOne: false
            referencedRelation: "reels"
            referencedColumns: ["id"]
          },
        ]
      }
      reels: {
        Row: {
          admin_note: string | null
          approved_at: string | null
          caption: string
          comment_count: number
          created_at: string
          duration_seconds: number
          id: string
          like_count: number
          product_id: string | null
          status: string
          thumbnail_url: string | null
          updated_at: string
          user_id: string
          video_url: string
          view_count: number
        }
        Insert: {
          admin_note?: string | null
          approved_at?: string | null
          caption?: string
          comment_count?: number
          created_at?: string
          duration_seconds: number
          id?: string
          like_count?: number
          product_id?: string | null
          status?: string
          thumbnail_url?: string | null
          updated_at?: string
          user_id: string
          video_url: string
          view_count?: number
        }
        Update: {
          admin_note?: string | null
          approved_at?: string | null
          caption?: string
          comment_count?: number
          created_at?: string
          duration_seconds?: number
          id?: string
          like_count?: number
          product_id?: string | null
          status?: string
          thumbnail_url?: string | null
          updated_at?: string
          user_id?: string
          video_url?: string
          view_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "reels_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reels_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "social_profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      sellers: {
        Row: {
          address: string | null
          business_email: string | null
          business_name: string
          business_phone: string | null
          city: string | null
          created_at: string
          gstin: string | null
          id: string
          is_approved: boolean | null
          is_blocked: boolean | null
          pincode: string | null
          state: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          address?: string | null
          business_email?: string | null
          business_name: string
          business_phone?: string | null
          city?: string | null
          created_at?: string
          gstin?: string | null
          id?: string
          is_approved?: boolean | null
          is_blocked?: boolean | null
          pincode?: string | null
          state?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          address?: string | null
          business_email?: string | null
          business_name?: string
          business_phone?: string | null
          city?: string | null
          created_at?: string
          gstin?: string | null
          id?: string
          is_approved?: boolean | null
          is_blocked?: boolean | null
          pincode?: string | null
          state?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      site_content: {
        Row: {
          content_key: string
          content_value: string
          created_at: string
          description: string | null
          id: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          content_key: string
          content_value?: string
          created_at?: string
          description?: string | null
          id?: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          content_key?: string
          content_value?: string
          created_at?: string
          description?: string | null
          id?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      social_profiles: {
        Row: {
          avatar_url: string | null
          bio: string
          created_at: string
          display_name: string
          followers_count: number
          following_count: number
          updated_at: string
          user_id: string
          username: string
          username_set: boolean
        }
        Insert: {
          avatar_url?: string | null
          bio?: string
          created_at?: string
          display_name?: string
          followers_count?: number
          following_count?: number
          updated_at?: string
          user_id: string
          username: string
          username_set?: boolean
        }
        Update: {
          avatar_url?: string | null
          bio?: string
          created_at?: string
          display_name?: string
          followers_count?: number
          following_count?: number
          updated_at?: string
          user_id?: string
          username?: string
          username_set?: boolean
        }
        Relationships: []
      }
      suppressed_emails: {
        Row: {
          created_at: string
          email: string
          id: string
          metadata: Json | null
          reason: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          metadata?: Json | null
          reason: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          metadata?: Json | null
          reason?: string
        }
        Relationships: []
      }
      tech_video_comments: {
        Row: {
          body: string
          created_at: string
          id: string
          user_id: string
          video_id: string
        }
        Insert: {
          body: string
          created_at?: string
          id?: string
          user_id: string
          video_id: string
        }
        Update: {
          body?: string
          created_at?: string
          id?: string
          user_id?: string
          video_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tech_video_comments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "social_profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "tech_video_comments_video_id_fkey"
            columns: ["video_id"]
            isOneToOne: false
            referencedRelation: "tech_videos"
            referencedColumns: ["id"]
          },
        ]
      }
      tech_video_reactions: {
        Row: {
          created_at: string
          user_id: string
          value: number
          video_id: string
        }
        Insert: {
          created_at?: string
          user_id: string
          value: number
          video_id: string
        }
        Update: {
          created_at?: string
          user_id?: string
          value?: number
          video_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tech_video_reactions_video_id_fkey"
            columns: ["video_id"]
            isOneToOne: false
            referencedRelation: "tech_videos"
            referencedColumns: ["id"]
          },
        ]
      }
      tech_video_views: {
        Row: {
          day: string
          video_id: string
          viewer_id: string
        }
        Insert: {
          day?: string
          video_id: string
          viewer_id: string
        }
        Update: {
          day?: string
          video_id?: string
          viewer_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tech_video_views_video_id_fkey"
            columns: ["video_id"]
            isOneToOne: false
            referencedRelation: "tech_videos"
            referencedColumns: ["id"]
          },
        ]
      }
      tech_videos: {
        Row: {
          admin_note: string | null
          approved_at: string | null
          category: string
          created_at: string
          description: string
          duration_seconds: number
          id: string
          monetized_views: number
          status: string
          thumbnail_url: string | null
          title: string
          updated_at: string
          user_id: string
          video_url: string
          view_count: number
        }
        Insert: {
          admin_note?: string | null
          approved_at?: string | null
          category?: string
          created_at?: string
          description?: string
          duration_seconds: number
          id?: string
          monetized_views?: number
          status?: string
          thumbnail_url?: string | null
          title: string
          updated_at?: string
          user_id: string
          video_url: string
          view_count?: number
        }
        Update: {
          admin_note?: string | null
          approved_at?: string | null
          category?: string
          created_at?: string
          description?: string
          duration_seconds?: number
          id?: string
          monetized_views?: number
          status?: string
          thumbnail_url?: string | null
          title?: string
          updated_at?: string
          user_id?: string
          video_url?: string
          view_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "tech_videos_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "social_profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      user_follows: {
        Row: {
          created_at: string
          follower_id: string
          following_id: string
        }
        Insert: {
          created_at?: string
          follower_id: string
          following_id: string
        }
        Update: {
          created_at?: string
          follower_id?: string
          following_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_follows_follower_id_fkey"
            columns: ["follower_id"]
            isOneToOne: false
            referencedRelation: "social_profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "user_follows_following_id_fkey"
            columns: ["following_id"]
            isOneToOne: false
            referencedRelation: "social_profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      video_campaign_events: {
        Row: {
          campaign_id: string
          day: string
          event_type: string
          user_id: string
        }
        Insert: {
          campaign_id: string
          day?: string
          event_type: string
          user_id: string
        }
        Update: {
          campaign_id?: string
          day?: string
          event_type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "video_campaign_events_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "video_campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
      video_campaigns: {
        Row: {
          admin_note: string
          amount_inr: number
          brand_name: string
          created_at: string
          ends_at: string | null
          id: string
          kind: string
          pack_days: number
          payment_status: string
          razorpay_payment_id: string | null
          starts_at: string | null
          status: string
          user_id: string
          video_id: string
        }
        Insert: {
          admin_note?: string
          amount_inr: number
          brand_name?: string
          created_at?: string
          ends_at?: string | null
          id?: string
          kind: string
          pack_days: number
          payment_status?: string
          razorpay_payment_id?: string | null
          starts_at?: string | null
          status?: string
          user_id: string
          video_id: string
        }
        Update: {
          admin_note?: string
          amount_inr?: number
          brand_name?: string
          created_at?: string
          ends_at?: string | null
          id?: string
          kind?: string
          pack_days?: number
          payment_status?: string
          razorpay_payment_id?: string | null
          starts_at?: string | null
          status?: string
          user_id?: string
          video_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "video_campaigns_video_id_fkey"
            columns: ["video_id"]
            isOneToOne: false
            referencedRelation: "tech_videos"
            referencedColumns: ["id"]
          },
        ]
      }
      wishlist_items: {
        Row: {
          created_at: string
          id: string
          product_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          product_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          product_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "wishlist_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      active_video_campaigns: {
        Args: never
        Returns: {
          brand_name: string
          campaign_id: string
          category: string
          duration_seconds: number
          kind: string
          thumbnail_url: string
          title: string
          video_id: string
          view_count: number
        }[]
      }
      add_coins: { Args: { _coins: number }; Returns: number }
      broadcast_notification: {
        Args: { _message: string; _title: string; _type?: string }
        Returns: number
      }
      campaign_metrics: {
        Args: never
        Returns: {
          campaign_id: string
          clicks: number
          impressions: number
        }[]
      }
      create_video_campaign: {
        Args: {
          _brand_name: string
          _days: number
          _kind: string
          _video_id: string
        }
        Returns: string
      }
      creator_balances: {
        Args: { _user_id?: string }
        Returns: {
          balance: number
          earned: number
          full_name: string
          monetized_views: number
          paid: number
          status: string
          upi_id: string
          user_id: string
          username: string
        }[]
      }
      ensure_social_profile: { Args: never; Returns: string }
      get_admin_users_overview: {
        Args: never
        Returns: {
          address: string
          city: string
          created_at: string
          email: string
          full_name: string
          is_blocked: boolean
          last_order_at: string
          last_sign_in_at: string
          order_count: number
          phone: string
          pincode: string
          roles: string[]
          state: string
          user_id: string
        }[]
      }
      get_product_reviews: {
        Args: { _limit?: number; _product_id: string }
        Returns: {
          comment: string
          created_at: string
          id: string
          is_verified_purchase: boolean
          product_id: string
          rating: number
          reviewer_name: string
          title: string
        }[]
      }
      get_recent_reviews: {
        Args: { _limit?: number }
        Returns: {
          comment: string
          created_at: string
          id: string
          rating: number
          reviewer_name: string
        }[]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      increment_coupon_usage: { Args: { _code: string }; Returns: undefined }
      is_bazaar_participant: {
        Args: { _conversation_id: string; _user_id: string }
        Returns: boolean
      }
      is_order_owner: {
        Args: { _order_id: string; _user_id: string }
        Returns: boolean
      }
      is_order_seller: {
        Args: { _order_id: string; _user_id: string }
        Returns: boolean
      }
      is_seller: { Args: { _user_id: string }; Returns: boolean }
      is_seller_order_item: {
        Args: { _seller_id: string; _user_id: string }
        Returns: boolean
      }
      log_admin_action: {
        Args: {
          _action: string
          _entity_id?: string
          _entity_type: string
          _metadata?: Json
        }
        Returns: string
      }
      mark_bazaar_read: {
        Args: { _conversation_id: string }
        Returns: undefined
      }
      moderate_video_campaign: {
        Args: { _id: string; _note?: string; _status: string }
        Returns: undefined
      }
      promotion_packs: {
        Args: never
        Returns: {
          days: number
          price: number
        }[]
      }
      record_campaign_event: {
        Args: { _event: string; _id: string }
        Returns: undefined
      }
      register_reel_view: { Args: { _reel_id: string }; Returns: undefined }
      register_tech_video_view: {
        Args: { _video_id: string }
        Returns: undefined
      }
      request_redeem: {
        Args: { _coins: number; _email: string }
        Returns: string
      }
      tech_video_reaction_counts: {
        Args: { _video_id: string }
        Returns: {
          down: number
          up: number
        }[]
      }
      validate_coupon: {
        Args: { _code: string; _order_amount: number }
        Returns: {
          code: string
          discount_type: string
          discount_value: number
          max_discount_amount: number
          min_order_amount: number
        }[]
      }
      video_rate_per_1000: { Args: never; Returns: number }
    }
    Enums: {
      app_role: "admin" | "seller" | "user"
      order_status:
        | "pending"
        | "confirmed"
        | "shipped"
        | "delivered"
        | "cancelled"
        | "returned"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "seller", "user"],
      order_status: [
        "pending",
        "confirmed",
        "shipped",
        "delivered",
        "cancelled",
        "returned",
      ],
    },
  },
} as const

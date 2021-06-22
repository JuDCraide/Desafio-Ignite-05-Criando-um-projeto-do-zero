import { useState } from 'react';
import { GetStaticProps, GetStaticPaths } from 'next';
import Head from 'next/head';
import Link from 'next/link';

import Prismic from '@prismicio/client';

import { format } from 'date-fns';
import ptBR from 'date-fns/locale/pt-BR';

import { FiCalendar, FiUser } from 'react-icons/fi';

import { getPrismicClient } from '../services/prismic';

import commonStyles from '../styles/common.module.scss';
import styles from './home.module.scss';

interface Post {
  uid?: string;
  first_publication_date: string | null;
  data: {
    title: string;
    subtitle: string;
    author: string;
  };
}

interface PostPagination {
  next_page: string | null;
  results: Post[];
}

interface HomeProps {
  postsPagination: PostPagination;
}

export default function Home({ postsPagination }: HomeProps) {
  const [nextPage, setNextPage] = useState(postsPagination.next_page);

  const [posts, setPosts] = useState(() => {
    return postsPagination.results.map(post => {
      const { first_publication_date, ...postRest } = post;
      return {
        first_publication_date: format(
          new Date(first_publication_date),
          'dd MMM yyyy',
          {
            locale: ptBR,
          }
        ),
        ...postRest,
      };
    });
  });

  async function handelRenderMorePost() {
    const postsResponse = await fetch(nextPage);

    const postsData: PostPagination = await postsResponse.json();

    const newPosts = postsData.results.map((post): Post => {
      const { first_publication_date, ...postRest } = post;
      return {
        first_publication_date: format(
          new Date(first_publication_date),
          'dd MMM yyyy',
          {
            locale: ptBR,
          }
        ),
        ...postRest,
      };
    });

    setPosts(oldPosts => [...oldPosts, ...newPosts]);
    setNextPage(postsData.next_page);
  }

  return (
    <>
      <Head>
        <title>Space Traveling</title>
      </Head>
      <main className={commonStyles.container}>
        {posts.map(post => (
          <Link href={`post/${post.uid}`}>
            <a key={post.uid} className={styles.post}>
              <h2>{post.data.title}</h2>
              <p>{post.data.subtitle}</p>
              <div className={styles.info}>
                <div className={styles.infoItem}>
                  <FiCalendar />
                  <span>{post.first_publication_date}</span>
                </div>
                <div className={styles.infoItem}>
                  <FiUser />
                  <span>{post.data.author}</span>
                </div>
              </div>
            </a>
          </Link>
        ))}

        {nextPage && (
          <button
            type="button"
            className={styles.loadButton}
            onClick={handelRenderMorePost}
          >
            Carregar mais posts
          </button>
        )}
      </main>
    </>
  );
}

export const getStaticPaths: GetStaticPaths = async () => {
  return {
    paths: [],
    fallback: 'blocking',
  };
};

export const getStaticProps: GetStaticProps = async () => {
  const prismic = getPrismicClient();
  const postsResponse = await prismic.query(
    [Prismic.predicates.at('document.type', 'post')],
    {
      fetch: ['post.title', 'post.subtitle', 'post.author'],
      pageSize: 2,
    }
  );

  return {
    props: {
      postsPagination: {
        ...postsResponse,
      },
    },
    revalidate: 60 * 30, // meia hora em segundos
  };
};

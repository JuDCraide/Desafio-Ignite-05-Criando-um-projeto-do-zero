/* eslint-disable react/no-danger */
import { useMemo } from 'react';

import { GetStaticPaths, GetStaticProps } from 'next';
import Head from 'next/head';
import { useRouter } from 'next/router';

import Prismic from '@prismicio/client';
import { RichText } from 'prismic-dom';

import { format } from 'date-fns';
import ptBR from 'date-fns/locale/pt-BR';

import { FiCalendar, FiUser, FiClock } from 'react-icons/fi';

import { getPrismicClient } from '../../services/prismic';

import commonStyles from '../../styles/common.module.scss';
import styles from './post.module.scss';

interface Post {
  first_publication_date: string | null;
  data: {
    title: string;
    banner: {
      url: string;
    };
    author: string;
    content: {
      heading: string;
      body: {
        text: string;
      }[];
    }[];
  };
}

interface PostProps {
  post: Post;
}

export default function Post({ post }: PostProps) {
  const router = useRouter();
  if (router.isFallback) {
    return (
      <div className={commonStyles.container}>
        <div className={styles.loading}>
          <p>Carregando...</p>
        </div>
      </div>
    );
  }

  const formattedPublicationDate = format(
    new Date(post.first_publication_date),
    'dd MMM yyyy',
    {
      locale: ptBR,
    }
  );

  const wordCount = post.data.content.reduce((words, section) => {
    return (
      words +
      section.heading.split(' ').length +
      RichText.asText(section.body).split(' ').length
    );
  }, 0);

  const readingTime = Math.ceil(wordCount / 200);

  return (
    <>
      <Head>
        <title>Space Traveling</title>
      </Head>
      <main className={commonStyles.container}>
        <img
          className={styles.banner}
          src={post.data.banner.url}
          alt={post.data.title}
        />
        <div className={styles.post}>
          <h1>{post.data.title}</h1>
          <div className={styles.info}>
            <div className={styles.infoItem}>
              <FiCalendar />
              <span>{formattedPublicationDate}</span>
            </div>
            <div className={styles.infoItem}>
              <FiUser />
              <span>{post.data.author}</span>
            </div>
            <div className={styles.infoItem}>
              <FiClock />
              <span>{`${readingTime} min`}</span>
            </div>
          </div>
          <div>
            {post.data.content.map((section, index) => (
              <div id={String(index)}>
                <h2>{section.heading}</h2>
                <div
                  dangerouslySetInnerHTML={{
                    __html: RichText.asHtml(section.body),
                  }}
                />
              </div>
            ))}
          </div>
        </div>
      </main>
    </>
  );
}

export const getStaticPaths: GetStaticPaths = async () => {
  const prismic = getPrismicClient();
  const posts = await prismic.query([
    Prismic.Predicates.at('document.type', 'posts'),
  ]);

  const paths = posts.results.map(post => ({
    params: { slug: post.uid },
  }));
  return {
    fallback: true,
    paths,
  };
};

export const getStaticProps: GetStaticProps = async context => {
  const uid = context.params.slug;
  try {
    const prismic = getPrismicClient();
    const response = await prismic.getByUID('post', String(uid), {});

    return {
      props: {
        post: response,
      },
    };
  } catch (err) {
    return {
      props: {
        post: null,
      },
    };
  }
};
